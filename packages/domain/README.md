# Shared domain

This package contains pure behavior that is already identical on web and
mobile. It intentionally does not hide known product-model differences.

- Calendar arithmetic treats `YYYY-MM-DD` as a label, so DST cannot skip days.
- The logging-streak engine counts real logs and consumed freezes, while pause
  days only bridge the days on either side.
- Nutrition safety constants, Mifflin-St Jeor math, BMI math, and calorie-ring
  presentation are shared.

Target adapters remain client-specific for now. The characterization fixture
records the current differences: activity multipliers, rate units, optional
body-fat handling, macro splits, and display rounding. Converging those rules
requires an explicit product and clinical decision rather than a code cleanup.

Local-day assignment also remains client-specific. Mobile stores the calendar
day in the profile timezone when an entry is written. Web currently derives a
calendar day from the entry timestamp in the device's current timezone when it
is read. The shared streak engine starts after that adapter boundary. Making web
travel-stable requires a versioned `localDate` field and migration; extraction
alone must not pretend those policies are already equivalent.
