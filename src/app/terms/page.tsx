"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useLanguage } from "@/context/LanguageContext";

export default function TermsPage() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t("terms.title")}</h1>
          <p className="text-gray-500 mb-8">Last updated: January 1, 2026</p>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 text-gray-700 leading-relaxed">

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Berenda (&quot;the Platform&quot;), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
              <p>
                Berenda is an online marketplace that connects property owners (Hosts) with individuals seeking short-term or long-term accommodation in Ethiopia. We facilitate listings, bookings, and payments between Hosts and Guests.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Accounts</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>You must be at least 18 years old to create an account.</li>
                <li>You are responsible for maintaining the security of your account credentials.</li>
                <li>You agree to provide accurate and complete information during registration.</li>
                <li>Berenda reserves the right to suspend or terminate accounts that violate these terms.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Host Responsibilities</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Hosts must ensure their listings are accurate, up-to-date, and not misleading.</li>
                <li>Hosts are responsible for maintaining the safety and cleanliness of their properties.</li>
                <li>Hosts must comply with all applicable Ethiopian laws and regulations, including those related to property rental.</li>
                <li>Hosts must confirm bookings promptly and contact Guests to finalize arrangements.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Guest Responsibilities</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Guests must treat Host properties with respect and leave them in good condition.</li>
                <li>Guests agree to use the property only for the purposes agreed upon at booking.</li>
                <li>Guests must not exceed the maximum guest count specified in the listing.</li>
                <li>Guests are responsible for any damages they cause to a Host&apos;s property.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Payments and Fees</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>All prices on the Platform are listed in Ethiopian Birr (ETB) unless otherwise stated.</li>
                <li>Payments are processed through Chapa payment gateway (Telebirr, CBE Birr, and cards).</li>
                <li>Berenda may charge a service fee on bookings, which will be disclosed before payment.</li>
                <li>Refund policies are determined by the Host and disclosed in the listing.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cancellations</h2>
              <p>
                Cancellation policies vary by listing. Please review the Host&apos;s cancellation policy before booking. In the event of a dispute, Berenda may mediate at its discretion.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Prohibited Activities</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Fraudulent listings or bookings.</li>
                <li>Harassment or abuse of other users.</li>
                <li>Circumventing the Platform to complete transactions off-platform.</li>
                <li>Uploading illegal, harmful, or misleading content.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
              <p>
                Berenda acts solely as an intermediary between Hosts and Guests. We are not responsible for the condition of properties, disputes between users, or losses arising from bookings. To the maximum extent permitted by Ethiopian law, our liability is limited to the fees collected from the relevant transaction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Privacy</h2>
              <p>
                Your use of the Platform is also governed by our Privacy Policy. We collect and use your data in accordance with applicable Ethiopian data protection regulations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. Continued use of the Platform after changes are posted constitutes your acceptance of the revised Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contact</h2>
              <p>
                For questions about these Terms, please contact us at{" "}
                <a href="mailto:berenda@gmail.com" className="text-red-600 hover:underline">
                  berenda@gmail.com
                </a>
              </p>
            </section>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              ← Go Back
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
