package com.apoorvdarshan.calorietracker.ui.components

import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.core.content.ContextCompat
import com.apoorvdarshan.calorietracker.ui.theme.AppColors
import java.io.File

@Composable
fun InAppCameraCaptureDialog(
    onCapture: (ByteArray) -> Unit,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val mainExecutor = ContextCompat.getMainExecutor(context)
    val previewView = remember {
        PreviewView(context).apply {
            scaleType = PreviewView.ScaleType.FILL_CENTER
        }
    }
    var imageCapture by remember { mutableStateOf<ImageCapture?>(null) }
    var isCapturing by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    DisposableEffect(lifecycleOwner) {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        val listener = Runnable {
            val cameraProvider = cameraProviderFuture.get()
            val preview = Preview.Builder().build().also {
                it.surfaceProvider = previewView.surfaceProvider
            }
            val capture = ImageCapture.Builder()
                .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                .build()

            runCatching {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    lifecycleOwner,
                    CameraSelector.DEFAULT_BACK_CAMERA,
                    preview,
                    capture
                )
                imageCapture = capture
            }.onFailure {
                error = "Could not open camera"
            }
        }
        cameraProviderFuture.addListener(listener, mainExecutor)

        onDispose {
            imageCapture = null
            runCatching { cameraProviderFuture.get().unbindAll() }
        }
    }

    Dialog(
        onDismissRequest = {
            if (!isCapturing) onDismiss()
        },
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black)
        ) {
            AndroidView(
                factory = { previewView },
                modifier = Modifier.fillMaxSize()
            )

            IconButton(
                onClick = onDismiss,
                enabled = !isCapturing,
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(18.dp)
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(Color.Black.copy(alpha = 0.45f))
            ) {
                Icon(Icons.Filled.Close, contentDescription = "Close camera", tint = Color.White)
            }

            error?.let {
                Text(
                    text = it,
                    color = Color.White,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier
                        .align(Alignment.TopCenter)
                        .padding(top = 28.dp)
                        .background(Color.Black.copy(alpha = 0.55f), CircleShape)
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }

            IconButton(
                onClick = {
                    val capture = imageCapture ?: return@IconButton
                    val dir = File(context.cacheDir, "in-app-camera").apply { mkdirs() }
                    val file = File(dir, "shot-${System.currentTimeMillis()}.jpg")
                    val output = ImageCapture.OutputFileOptions.Builder(file).build()

                    isCapturing = true
                    error = null
                    capture.targetRotation = previewView.display.rotation
                    capture.takePicture(
                        output,
                        mainExecutor,
                        object : ImageCapture.OnImageSavedCallback {
                            override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
                                val bytes = runCatching { file.readBytes() }.getOrNull()
                                runCatching { file.delete() }
                                isCapturing = false
                                if (bytes != null && bytes.isNotEmpty()) {
                                    onCapture(bytes)
                                } else {
                                    error = "Could not save photo"
                                }
                            }

                            override fun onError(exception: ImageCaptureException) {
                                runCatching { file.delete() }
                                isCapturing = false
                                error = "Could not capture photo"
                            }
                        }
                    )
                },
                enabled = imageCapture != null && !isCapturing,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 36.dp)
                    .size(76.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.95f))
                    .border(5.dp, AppColors.Calorie, CircleShape)
            ) {
                if (isCapturing) {
                    CircularProgressIndicator(
                        color = AppColors.Calorie,
                        strokeWidth = 3.dp,
                        modifier = Modifier.size(30.dp)
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.25f))
                    )
                }
            }
        }
    }
}
