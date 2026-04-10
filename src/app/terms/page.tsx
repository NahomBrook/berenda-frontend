"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useLanguage } from "@/context/LanguageContext";

const content = {
  en: {
    title: "Terms & Conditions",
    updated: "Last updated: January 1, 2026",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        body: "By accessing or using Berenda ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the Platform.",
      },
      {
        heading: "2. Description of Service",
        body: "Berenda is an online marketplace that connects property owners (Hosts) with individuals seeking short-term or long-term accommodation in Ethiopia. We facilitate listings, bookings, and payments between Hosts and Guests.",
      },
      {
        heading: "3. User Accounts",
        bullets: [
          "You must be at least 18 years old to create an account.",
          "You are responsible for maintaining the security of your account credentials.",
          "You agree to provide accurate and complete information during registration.",
          "Berenda reserves the right to suspend or terminate accounts that violate these terms.",
        ],
      },
      {
        heading: "4. Host Responsibilities",
        bullets: [
          "Hosts must ensure their listings are accurate, up-to-date, and not misleading.",
          "Hosts are responsible for maintaining the safety and cleanliness of their properties.",
          "Hosts must comply with all applicable Ethiopian laws and regulations, including those related to property rental.",
          "Hosts must confirm bookings promptly and contact Guests to finalize arrangements.",
        ],
      },
      {
        heading: "5. Guest Responsibilities",
        bullets: [
          "Guests must treat Host properties with respect and leave them in good condition.",
          "Guests agree to use the property only for the purposes agreed upon at booking.",
          "Guests must not exceed the maximum guest count specified in the listing.",
          "Guests are responsible for any damages they cause to a Host's property.",
        ],
      },
      {
        heading: "6. Payments and Fees",
        bullets: [
          "All prices on the Platform are listed in Ethiopian Birr (ETB) unless otherwise stated.",
          "Payments are processed through Chapa payment gateway (Telebirr, CBE Birr, and cards).",
          "Berenda may charge a service fee on bookings, which will be disclosed before payment.",
          "Refund policies are determined by the Host and disclosed in the listing.",
        ],
      },
      {
        heading: "7. Cancellations",
        body: "Cancellation policies vary by listing. Please review the Host's cancellation policy before booking. In the event of a dispute, Berenda may mediate at its discretion.",
      },
      {
        heading: "8. Prohibited Activities",
        bullets: [
          "Fraudulent listings or bookings.",
          "Harassment or abuse of other users.",
          "Circumventing the Platform to complete transactions off-platform.",
          "Uploading illegal, harmful, or misleading content.",
        ],
      },
      {
        heading: "9. Limitation of Liability",
        body: "Berenda acts solely as an intermediary between Hosts and Guests. We are not responsible for the condition of properties, disputes between users, or losses arising from bookings. To the maximum extent permitted by Ethiopian law, our liability is limited to the fees collected from the relevant transaction.",
      },
      {
        heading: "10. Privacy",
        body: "Your use of the Platform is also governed by our Privacy Policy. We collect and use your data in accordance with applicable Ethiopian data protection regulations.",
      },
      {
        heading: "11. Changes to Terms",
        body: "We reserve the right to modify these Terms at any time. Continued use of the Platform after changes are posted constitutes your acceptance of the revised Terms.",
      },
      {
        heading: "12. Contact",
        contact: true,
      },
    ],
    contactPre: "For questions about these Terms, please contact us at",
    back: "← Go Back",
  },
  am: {
    title: "ውሎች እና ሁኔታዎች",
    updated: "መጨረሻ የተዘመነ፡ ጥር 23፣ 2018 ዓ.ም.",
    sections: [
      {
        heading: "1. ውሎቹን መቀበል",
        body: "በረንዳን («መድረክ») በመጠቀም ወይም በማዳረስ፣ ከዚህ ውሎችና ሁኔታዎች ጋር መስማማትዎን ያረጋግጣሉ። ካልተስማሙ፣ እባክዎ መድረኩን አይጠቀሙ።",
      },
      {
        heading: "2. አገልግሎቱ ምንድን ነው",
        body: "በረንዳ ለኢትዮጵያ ውስጥ ቤት ለተከራዮች (አስተናጋጆች) እና ለተከራዮች (እንግዶች) የሚያገናኝ የኦንላይን ገበያ ነው። ዝርዝሮችን፣ ቦታ ምዝገባዎችን እና ክፍያዎችን ለማሳለጥ እናበረታታለን።",
      },
      {
        heading: "3. የተጠቃሚ መለያ",
        bullets: [
          "መለያ ለመፍጠር ቢያንስ 18 ዓመት ሊሆንዎ ይገባል።",
          "የመለያ ምስጢሮቻቸውን ጥበቃ ለማድረግ እርስዎ ሃላፊነት አለብዎ።",
          "ምዝገባ ጊዜ ትክክለኛ እና ሙሉ መረጃ መስጠት ይስማማሉ።",
          "ውሎቹን የሚጥሱ መለያዎችን ለማገድ ወይም ለማዘጋት በረንዳ መብት ይኖረዋል።",
        ],
      },
      {
        heading: "4. የአስተናጋጅ ሃላፊነቶች",
        bullets: [
          "አስተናጋጆች ዝርዝሮቻቸው ትክክለኛ፣ ወቅቱን የጠበቁ እና አሳሳቹ አለመሆናቸውን ማረጋገጥ አለባቸው።",
          "አስተናጋጆች ንብረቶቻቸው ደህንነት እና ንጽህና ለመጠበቅ ሃላፊነት አለባቸው።",
          "አስተናጋጆች ሁሉንም ተፈጻሚ የሆኑ የኢትዮጵያ ሕጎችን እና ደንቦችን፣ ለኪራይ ንብረት ጋር ተያያዥ ሕጎችን ጨምሮ፣ ማክበር አለባቸው።",
          "አስተናጋጆች ምዝገቦቻቸውን ፈጥነው ማረጋገጥ እና ዝርዝሮቹን ለማጠናቀቅ እንግዶቹን ማናገር አለባቸው።",
        ],
      },
      {
        heading: "5. የእንግዳ ሃላፊነቶች",
        bullets: [
          "እንግዶች የአስተናጋጅ ንብረቶችን ከፍ ያለ ዋጋ ሰጥተው በጥሩ ሁኔታ ማስረከብ አለባቸው።",
          "እንግዶች ንብረቱን ቦታ ምዝገባ ጊዜ ለተስማሙበት ዓላማ ብቻ ለመጠቀም ይስማማሉ።",
          "እንግዶች በዝርዝሩ ላይ ከተጠቀሰው ከፍተኛ የእንግዳ ቁጥር ማለፍ የለባቸውም።",
          "እንግዶች ለሚያደርሱት ማናቸውም ጉዳቶች ሃላፊነት አለባቸው።",
        ],
      },
      {
        heading: "6. ክፍያዎች እና ክፍያ አወቃቀር",
        bullets: [
          "በመድረኩ ላይ ያሉ ሁሉም ዋጋዎች በኢትዮጵያ ብር (ብር) የተዘረዘሩ ናቸው ካልተገለጸ በቀር።",
          "ክፍያዎች በቻፓ የክፍያ በር (ቴሌብር፣ ንግድ ባንክ ብር እና ካርዶች) ይካሄዳሉ።",
          "በረንዳ ምዝገቦች ላይ የአገልግሎት ክፍያ ሊጥል ይችላል፣ ይህም ክፍያ ከመፈጸሙ በፊት ይገለጻል።",
          "የመመለሻ ፖሊሲ በአስተናጋጁ ይወሰናል እና በዝርዝሩ ላይ ይገለጻል።",
        ],
      },
      {
        heading: "7. መሰረዣ",
        body: "የመሰረዣ ፖሊሲዎች እንደ ዝርዝሩ ይለያያሉ። ምዝገባ ከመፍጸምዎ በፊት እባክዎ የአስተናጋጁን የመሰረዣ ፖሊሲ ይፈትሹ። አለመግባባት ቢፈጠር፣ በረንዳ በፈቃዱ ሊሸምግል ይችላል።",
      },
      {
        heading: "8. የተከለከሉ ተግባራት",
        bullets: [
          "አስመሳይ ዝርዝሮች ወይም ምዝገቦች።",
          "ሌሎች ተጠቃሚዎችን ማስጨነቅ ወይም ማጥቃት።",
          "ግብይቶችን ከመድረኩ ውጭ ለማጠናቀቅ መድረኩን ማለፍ።",
          "ሕገ-ወጥ፣ ጎጂ ወይም አሳሳች ይዘቶችን መስቀል።",
        ],
      },
      {
        heading: "9. ሃላፊነት ገደብ",
        body: "በረንዳ ሙሉ ለሙሉ እንደ አስተናጋጆችና እንግዶች መካከለኛ ሆኖ ይሰራል። የንብረቶቹ ሁኔታ፣ በተጠቃሚዎች መካከል ያሉ አለመግባባቶች ወይም ከምዝገቦች የሚነሱ ኪሳራዎች ሃላፊነት አይወስድም። በኢትዮጵያ ሕግ በሚፈቀደው ሙሉ ደረጃ፣ ሃላፊነታችን ከተዛማጁ ግብይት የተሰበሰቡ ክፍያዎች ላይ ብቻ ይወሰናል።",
      },
      {
        heading: "10. ግላዊነት",
        body: "መድረኩን መጠቀምዎ በእኛ የግላዊነት ፖሊሲ ላይ ይቆጣጠራል። ውሂብዎን እንሰበስብ እና ተፈጻሚ በሆኑ የኢትዮጵያ ውሂብ ጥበቃ ደንቦች መሰረት እንጠቀምበታለን።",
      },
      {
        heading: "11. ለውሎቹ ለውጦች",
        body: "ውሎቹን በማናቸውም ጊዜ ለማሻሻል መብት እናስቀምጣለን። ለውጦቹ ከተለጠፉ በኋላ መድረኩን መቀጠሉ ከተሻሻሉ ውሎቹ ጋር መስማማትዎን ያሳያል።",
      },
      {
        heading: "12. አግኙን",
        contact: true,
      },
    ],
    contactPre: "ስለ እነዚህ ውሎች ጥያቄዎች ካሉዎ፣ እባክዎ በሚከተለው አድራሻ ያናግሩን",
    back: "← ተመለስ",
  },
};

export default function TermsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const c = content[language as "en" | "am"] ?? content.en;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 flex flex-col">
        <div className="max-w-3xl mx-auto px-4 py-12 flex-1 w-full">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{c.title}</h1>
          <p className="text-gray-500 mb-8">{c.updated}</p>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 text-gray-700 leading-relaxed">
            {c.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">{section.heading}</h2>
                {"body" in section && section.body && <p>{section.body}</p>}
                {"bullets" in section && section.bullets && (
                  <ul className="list-disc pl-5 space-y-2">
                    {section.bullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                )}
                {"contact" in section && section.contact && (
                  <p>
                    {c.contactPre}{" "}
                    <a href="mailto:berenda@gmail.com" className="text-red-600 hover:underline">
                      berenda@gmail.com
                    </a>
                  </p>
                )}
              </section>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              {c.back}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
