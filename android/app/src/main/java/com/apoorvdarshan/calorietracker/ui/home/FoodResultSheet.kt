package com.apoorvdarshan.calorietracker.ui.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.UnfoldMore
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SheetValue
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.apoorvdarshan.calorietracker.R
import com.apoorvdarshan.calorietracker.models.FoodEntry
import com.apoorvdarshan.calorietracker.models.FoodSource
import com.apoorvdarshan.calorietracker.models.MacroValueFormatter
import com.apoorvdarshan.calorietracker.models.MealType
import com.apoorvdarshan.calorietracker.models.ServingUnitOption
import com.apoorvdarshan.calorietracker.models.UserProfile
import com.apoorvdarshan.calorietracker.services.ai.FoodAnalysis
import com.apoorvdarshan.calorietracker.ui.theme.AppColors
import kotlin.math.roundToInt
import java.time.Instant

/**
 * First-time review sheet shown after photo / text / voice analysis returns
 * a [FoodAnalysis]. Visually identical to [EditFoodEntrySheet] — only the
 * top-right action differs ("Log" vs "Save"). Shared visual primitives live
 * in FoodSheetPrimitives.kt.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FoodResultSheet(
    analysis: FoodAnalysis,
    imageBytes: ByteArray? = null,
    preferGramsByDefault: Boolean = false,
    profile: UserProfile? = null,
    dayEntries: List<FoodEntry> = emptyList(),
    source: FoodSource = FoodSource.TEXT_INPUT,
    onWhatIfSuggestion: suspend (FoodEntry) -> String = {
        "Finish onboarding first to compare this meal against your daily goals."
    },
    onSave: (
        name: String,
        servingGrams: Double,
        scale: Double,
        mealType: MealType,
        selectedServingUnit: String?,
        selectedServingQuantity: Double?
    ) -> Unit,
    onDismiss: () -> Unit
) {
    val bitmap = remember(imageBytes) {
        imageBytes?.let { android.graphics.BitmapFactory.decodeByteArray(it, 0, it.size) }
    }
    val state = rememberModalBottomSheetState(
        skipPartiallyExpanded = true,
        confirmValueChange = { it != SheetValue.Hidden }
    )
    var name by remember { mutableStateOf(analysis.name) }
    val servingUnitOptions = remember(analysis.servingUnitOptions, analysis.servingSizeGrams) {
        ServingUnitOption.normalizedOptions(analysis.servingUnitOptions, analysis.servingSizeGrams)
    }
    val initialServingUnit = if (preferGramsByDefault) {
        ServingUnitOption.grams.unit
    } else {
        analysis.selectedServingUnit
    }
    var selectedServingUnitId by remember(analysis, servingUnitOptions, preferGramsByDefault) {
        mutableStateOf(ServingUnitOption.initialUnitId(initialServingUnit, servingUnitOptions))
    }
    var servingGrams by remember(analysis) { mutableStateOf(analysis.servingSizeGrams) }
    var servingQuantityText by remember(analysis, servingUnitOptions, preferGramsByDefault) {
        mutableStateOf(
            ServingUnitOption.initialQuantityText(
                totalGrams = analysis.servingSizeGrams,
                selectedUnitId = selectedServingUnitId,
                selectedQuantity = analysis.selectedServingQuantity,
                options = servingUnitOptions
            )
        )
    }
    val selectedServingOption = ServingUnitOption.optionMatching(selectedServingUnitId, servingUnitOptions)
    val selectedServingQuantity = ServingUnitOption.parseQuantity(servingQuantityText)?.takeIf { it > 0 }
    val scale = if (analysis.servingSizeGrams > 0) servingGrams / analysis.servingSizeGrams else 1.0
    var mealType by remember { mutableStateOf(MealType.currentMeal) }
    var moreNutritionExpanded by remember { mutableStateOf(false) }
    var mealMenuExpanded by remember { mutableStateOf(false) }
    var servingMenuExpanded by remember { mutableStateOf(false) }
    val isDark = MaterialTheme.colorScheme.background.luminance() < 0.5f
    val sheetSurface = if (isDark) MaterialTheme.colorScheme.surface else Color(0xFFFAF3EE)
    val focusManager = LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current
    val dismissKeyboard = {
        focusManager.clearFocus(force = true)
        keyboardController?.hide()
    }

    fun scaledInt(v: Int) = (v * scale).roundToInt()
    fun scaledMacro(v: Double) = v * scale
    fun scaledD(v: Double?) = v?.let { ((it * scale) * 10).roundToInt() / 10.0 }
    fun previewEntry() = FoodEntry(
        name = name.trim().ifEmpty { analysis.name },
        calories = scaledInt(analysis.calories),
        protein = scaledMacro(analysis.protein),
        carbs = scaledMacro(analysis.carbs),
        fat = scaledMacro(analysis.fat),
        timestamp = Instant.now(),
        imageFilename = null,
        emoji = analysis.emoji,
        source = source,
        mealType = mealType,
        sugar = scaledD(analysis.sugar),
        addedSugar = scaledD(analysis.addedSugar),
        fiber = scaledD(analysis.fiber),
        saturatedFat = scaledD(analysis.saturatedFat),
        monounsaturatedFat = scaledD(analysis.monounsaturatedFat),
        polyunsaturatedFat = scaledD(analysis.polyunsaturatedFat),
        cholesterol = scaledD(analysis.cholesterol),
        sodium = scaledD(analysis.sodium),
        potassium = scaledD(analysis.potassium),
        transFat = scaledD(analysis.transFat),
        calcium = scaledD(analysis.calcium),
        iron = scaledD(analysis.iron),
        magnesium = scaledD(analysis.magnesium),
        zinc = scaledD(analysis.zinc),
        vitaminA = scaledD(analysis.vitaminA),
        vitaminC = scaledD(analysis.vitaminC),
        vitaminD = scaledD(analysis.vitaminD),
        vitaminB12 = scaledD(analysis.vitaminB12),
        vitaminE = scaledD(analysis.vitaminE),
        vitaminK = scaledD(analysis.vitaminK),
        folate = scaledD(analysis.folate),
        omega3 = scaledD(analysis.omega3),
        servingSizeGrams = servingGrams,
        servingUnitOptions = analysis.servingUnitOptions,
        selectedServingUnit = if (servingUnitOptions.isEmpty()) null else selectedServingOption.unit,
        selectedServingQuantity = if (servingUnitOptions.isEmpty()) null else selectedServingQuantity
    )
    var whatIfEntry by remember { mutableStateOf<FoodEntry?>(null) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = state,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
        containerColor = sheetSurface
    ) {
        SheetReviewToolbar(
            title = stringResource(R.string.sheet_review_food),
            primaryLabel = stringResource(R.string.action_log),
            secondaryLabel = stringResource(R.string.action_what_if),
            onCancel = onDismiss,
            onPrimary = {
                onSave(
                    name.trim().ifEmpty { analysis.name },
                    servingGrams,
                    scale,
                    mealType,
                    if (servingUnitOptions.isEmpty()) null else selectedServingOption.unit,
                    if (servingUnitOptions.isEmpty()) null else selectedServingQuantity
                )
            },
            onSecondary = { whatIfEntry = previewEntry() }
        )

        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .pointerInput(Unit) {
                    detectTapGestures(onTap = { dismissKeyboard() })
                }
                .padding(horizontal = 20.dp)
                .padding(bottom = 28.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            // Square hero (captured photo) OR 80sp emoji fallback — centered.
            item {
                Box(
                    Modifier.fillMaxWidth().padding(vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    if (bitmap != null) {
                        androidx.compose.foundation.Image(
                            bitmap = bitmap.asImageBitmap(),
                            contentDescription = null,
                            contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                            modifier = Modifier
                                .size(240.dp)
                                .clip(RoundedCornerShape(20.dp))
                        )
                    } else {
                        Text(analysis.emoji ?: "🍽", fontSize = 80.sp)
                    }
                }
            }

            item { SheetSectionHeader(stringResource(R.string.sheet_food_details)) }
            item {
                SheetPillRow {
                    Text(stringResource(R.string.sheet_name), fontSize = 17.sp, modifier = Modifier.padding(end = 8.dp))
                    Spacer(Modifier.weight(1f))
                    androidx.compose.foundation.text.BasicTextField(
                        value = name,
                        onValueChange = { name = it },
                        singleLine = true,
                        textStyle = androidx.compose.ui.text.TextStyle(
                            color = MaterialTheme.colorScheme.onSurface,
                            fontSize = 17.sp,
                            textAlign = androidx.compose.ui.text.style.TextAlign.End
                        ),
                        cursorBrush = androidx.compose.ui.graphics.SolidColor(AppColors.Calorie),
                        modifier = Modifier.weight(2f)
                    )
                }
            }

            item { SheetSectionHeader(stringResource(R.string.sheet_serving)) }
            item {
                ServingQuantityCard(
                    quantityText = servingQuantityText,
                    onQuantityChange = { newValue ->
                        servingQuantityText = newValue
                        ServingUnitOption.parseQuantity(newValue)?.takeIf { it > 0 }?.let {
                            servingGrams = it * selectedServingOption.gramsPerUnit
                        }
                    },
                    selectedUnitId = selectedServingUnitId,
                    onSelectedUnitChange = { optionId ->
                        selectedServingUnitId = optionId
                        val option = ServingUnitOption.optionMatching(optionId, servingUnitOptions)
                        val quantity = if (option.gramsPerUnit > 0) servingGrams / option.gramsPerUnit else servingGrams
                        servingQuantityText = ServingUnitOption.formatQuantity(quantity)
                    },
                    servingSizeGrams = servingGrams,
                    unitOptions = servingUnitOptions,
                    menuExpanded = servingMenuExpanded,
                    onMenuExpandedChange = { servingMenuExpanded = it },
                    gramUnit = stringResource(R.string.unit_g)
                )
            }

            item { SheetSectionHeader(stringResource(R.string.sheet_nutrition)) }
            item {
                SheetPillCard {
                    SheetNutritionRow(stringResource(R.string.nutrition_label_calories), "${scaledInt(analysis.calories)}", stringResource(R.string.unit_kcal))
                    SheetHairline()
                    SheetNutritionRow(stringResource(R.string.nutrition_label_protein), MacroValueFormatter.string(scaledMacro(analysis.protein)), stringResource(R.string.unit_g))
                    SheetHairline()
                    SheetNutritionRow(stringResource(R.string.nutrition_label_carbs), MacroValueFormatter.string(scaledMacro(analysis.carbs)), stringResource(R.string.unit_g))
                    SheetHairline()
                    SheetNutritionRow(stringResource(R.string.nutrition_label_fat), MacroValueFormatter.string(scaledMacro(analysis.fat)), stringResource(R.string.unit_g))
                }
            }

            // "More Nutrition" — own pill row with chevron-right that flips to
            // chevron-down when expanded; matches iOS DisclosureGroup.
            item {
                SheetPillRow(onClick = { moreNutritionExpanded = !moreNutritionExpanded }) {
                    Text(stringResource(R.string.sheet_more_nutrition), fontSize = 17.sp, modifier = Modifier.weight(1f))
                    Icon(
                        if (moreNutritionExpanded) Icons.Filled.KeyboardArrowDown
                        else Icons.Filled.KeyboardArrowRight,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                }
            }
            if (moreNutritionExpanded) {
                item {
                    SheetPillCard {
                        val gUnit = stringResource(R.string.unit_g)
                        val mgUnit = stringResource(R.string.unit_mg)
                        val mcgUnit = "mcg"
                        val emDash = stringResource(R.string.nutrition_em_dash)
                        val micros = listOf(
                            Triple(stringResource(R.string.sheet_micro_sugar), scaledD(analysis.sugar), gUnit),
                            Triple(stringResource(R.string.sheet_micro_added_sugar), scaledD(analysis.addedSugar), gUnit),
                            Triple(stringResource(R.string.sheet_micro_fiber), scaledD(analysis.fiber), gUnit),
                            Triple(stringResource(R.string.sheet_micro_saturated_fat), scaledD(analysis.saturatedFat), gUnit),
                            Triple(stringResource(R.string.sheet_micro_mono_fat), scaledD(analysis.monounsaturatedFat), gUnit),
                            Triple(stringResource(R.string.sheet_micro_poly_fat), scaledD(analysis.polyunsaturatedFat), gUnit),
                            Triple(stringResource(R.string.sheet_micro_cholesterol), scaledD(analysis.cholesterol), mgUnit),
                            Triple(stringResource(R.string.sheet_micro_sodium), scaledD(analysis.sodium), mgUnit),
                            Triple(stringResource(R.string.sheet_micro_potassium), scaledD(analysis.potassium), mgUnit),
                            Triple("Trans Fat", scaledD(analysis.transFat), gUnit),
                            Triple("Calcium", scaledD(analysis.calcium), mgUnit),
                            Triple("Iron", scaledD(analysis.iron), mgUnit),
                            Triple("Magnesium", scaledD(analysis.magnesium), mgUnit),
                            Triple("Zinc", scaledD(analysis.zinc), mgUnit),
                            Triple("Vitamin A", scaledD(analysis.vitaminA), mcgUnit),
                            Triple("Vitamin C", scaledD(analysis.vitaminC), mgUnit),
                            Triple("Vitamin D", scaledD(analysis.vitaminD), mcgUnit),
                            Triple("Vitamin B12", scaledD(analysis.vitaminB12), mcgUnit),
                            Triple("Vitamin E", scaledD(analysis.vitaminE), mgUnit),
                            Triple("Vitamin K", scaledD(analysis.vitaminK), mcgUnit),
                            Triple("Folate", scaledD(analysis.folate), mcgUnit),
                            Triple("Omega-3", scaledD(analysis.omega3), gUnit)
                        )
                        micros.forEachIndexed { idx, (label, value, unit) ->
                            if (idx > 0) SheetHairline()
                            SheetNutritionRow(
                                label,
                                value?.let { String.format("%.1f", it) } ?: emDash,
                                unit,
                                dim = true
                            )
                        }
                    }
                }
            }

            item { SheetSectionHeader(stringResource(R.string.sheet_meal)) }
            item {
                SheetPillRow(onClick = { mealMenuExpanded = true }) {
                    Text(stringResource(R.string.sheet_meal_type), fontSize = 17.sp, modifier = Modifier.weight(1f))
                    // Anchor the DropdownMenu inside the right-side cluster so
                    // it pops open under the value, not the row's left edge.
                    Box {
                        androidx.compose.foundation.layout.Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                sheetMealIcon(mealType),
                                contentDescription = null,
                                tint = AppColors.Calorie,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(Modifier.width(6.dp))
                            Text(
                                stringResource(mealType.displayNameRes),
                                fontSize = 17.sp,
                                color = AppColors.Calorie,
                                fontWeight = FontWeight.Medium
                            )
                            Spacer(Modifier.width(6.dp))
                            Icon(
                                Icons.Filled.UnfoldMore,
                                contentDescription = null,
                                tint = AppColors.Calorie
                            )
                        }
                        SheetGlassDropdownMenu(
                            expanded = mealMenuExpanded,
                            onDismissRequest = { mealMenuExpanded = false },
                            menuWidth = 184.dp
                        ) {
                            for (m in MealType.values()) {
                                SheetGlassDropdownMenuItem(
                                    label = stringResource(m.displayNameRes),
                                    leadingIcon = sheetMealIcon(m),
                                    selected = m == mealType,
                                    onClick = {
                                        mealType = m
                                        mealMenuExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    whatIfEntry?.let { entry ->
        WhatIfMealImpactDialog(
            entry = entry,
            dayEntries = dayEntries,
            profile = profile,
            onDismiss = { whatIfEntry = null },
            onSuggest = onWhatIfSuggestion
        )
    }
}

private data class WhatIfTotals(
    val calories: Int,
    val protein: Double,
    val carbs: Double,
    val fat: Double
) {
    operator fun plus(other: WhatIfTotals) = WhatIfTotals(
        calories = calories + other.calories,
        protein = protein + other.protein,
        carbs = carbs + other.carbs,
        fat = fat + other.fat
    )
}

private fun List<FoodEntry>.whatIfTotals() = WhatIfTotals(
    calories = sumOf { it.calories },
    protein = sumOf { it.protein },
    carbs = sumOf { it.carbs },
    fat = sumOf { it.fat }
)

private fun FoodEntry.whatIfTotals() = WhatIfTotals(
    calories = calories,
    protein = protein,
    carbs = carbs,
    fat = fat
)

@Composable
private fun WhatIfMealImpactDialog(
    entry: FoodEntry,
    dayEntries: List<FoodEntry>,
    profile: UserProfile?,
    onDismiss: () -> Unit,
    onSuggest: suspend (FoodEntry) -> String
) {
    val before = remember(dayEntries) { dayEntries.whatIfTotals() }
    val after = remember(before, entry) { before + entry.whatIfTotals() }
    var loading by remember(entry.id) { mutableStateOf(true) }
    var suggestion by remember(entry.id) { mutableStateOf<String?>(null) }
    var error by remember(entry.id) { mutableStateOf<String?>(null) }

    LaunchedEffect(entry.id) {
        loading = true
        suggestion = null
        error = null
        runCatching { onSuggest(entry) }
            .onSuccess { suggestion = it.ifBlank { null } }
            .onFailure { error = it.localizedMessage ?: "Could not load AI suggestion." }
        loading = false
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        shape = RoundedCornerShape(28.dp),
        title = {
            Text(
                stringResource(R.string.what_if_title),
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text(
                    stringResource(R.string.what_if_subtitle),
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.68f),
                    lineHeight = 19.sp
                )
                SheetPillCard {
                    WhatIfImpactRow(
                        label = stringResource(R.string.nutrition_label_calories),
                        added = "+${entry.calories} kcal",
                        total = profile?.let { "${after.calories} / ${it.effectiveCalories} kcal" }
                            ?: "${after.calories} kcal"
                    )
                    SheetHairline()
                    WhatIfImpactRow(
                        label = stringResource(R.string.nutrition_label_protein),
                        added = "+${whatIfGrams(entry.protein)}",
                        total = profile?.let { "${whatIfGrams(after.protein)} / ${it.effectiveProtein}g" }
                            ?: whatIfGrams(after.protein)
                    )
                    SheetHairline()
                    WhatIfImpactRow(
                        label = stringResource(R.string.nutrition_label_carbs),
                        added = "+${whatIfGrams(entry.carbs)}",
                        total = profile?.let { "${whatIfGrams(after.carbs)} / ${it.effectiveCarbs}g" }
                            ?: whatIfGrams(after.carbs)
                    )
                    SheetHairline()
                    WhatIfImpactRow(
                        label = stringResource(R.string.nutrition_label_fat),
                        added = "+${whatIfGrams(entry.fat)}",
                        total = profile?.let { "${whatIfGrams(after.fat)} / ${it.effectiveFat}g" }
                            ?: whatIfGrams(after.fat)
                    )
                }

                SheetPillCard {
                    Column(
                        Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 18.dp, vertical = 12.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            stringResource(R.string.what_if_ai_suggestion),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f)
                        )
                        if (loading) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(18.dp),
                                    strokeWidth = 2.dp,
                                    color = AppColors.Calorie
                                )
                                Text(
                                    stringResource(R.string.what_if_loading),
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.68f)
                                )
                            }
                        } else {
                            Text(
                                suggestion ?: error ?: stringResource(R.string.what_if_no_suggestion),
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.78f),
                                lineHeight = 19.sp
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text(stringResource(R.string.action_done), color = AppColors.Calorie)
            }
        }
    )
}

@Composable
private fun WhatIfImpactRow(
    label: String,
    added: String,
    total: String
) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(horizontal = 18.dp, vertical = 11.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(Modifier.weight(1f)) {
            Text(label, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
            Text(
                added,
                fontSize = 13.sp,
                color = AppColors.Calorie,
                fontWeight = FontWeight.Medium
            )
        }
        Text(
            total,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.72f)
        )
    }
}

private fun whatIfGrams(value: Double): String = "${MacroValueFormatter.string(value)}g"
