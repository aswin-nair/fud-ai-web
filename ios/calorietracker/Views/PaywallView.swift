import SwiftUI

/// Kept as a safe destination for stale navigation state in an upgraded app.
/// It intentionally contains no StoreKit/RevenueCat product, purchase, or
/// restore controls while managed AI lacks server-side entitlement checks.
struct PaywallView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "shield.slash.fill")
                .font(.system(size: 48))
                .foregroundStyle(AppColors.calorie)
                .accessibilityHidden(true)

            VStack(spacing: 10) {
                Text("Managed AI Unavailable")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .multilineTextAlignment(.center)

                Text("Fud AI Premium cannot be purchased or used while secure, server-verified subscription checks are being completed.")
                    .font(.system(.callout, design: .rounded))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)

                Text("Bring Your Own Key remains available. Your requests go directly to the AI provider you configure.")
                    .font(.system(.callout, design: .rounded))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal, 28)

            Spacer()

            Button {
                AIAccessSettings.mode = .bringYourOwnKey
                dismiss()
            } label: {
                Label("Use Bring Your Own Key", systemImage: "key.fill")
                    .font(.system(.body, design: .rounded, weight: .semibold))
                    .foregroundStyle(Color(.systemBackground))
                    .frame(maxWidth: .infinity)
                    .frame(height: 54)
                    .background(Color.primary, in: Capsule())
            }
            .padding(.horizontal, 24)

            Text("If you previously subscribed, manage or cancel it in Settings → Apple Account → Subscriptions.")
                .font(.system(.caption, design: .rounded))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 28)
                .padding(.bottom, 32)
        }
        .background(AppColors.appBackground)
        .interactiveDismissDisabled(false)
    }
}
