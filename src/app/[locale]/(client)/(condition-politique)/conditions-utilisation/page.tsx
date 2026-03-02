"use client"
import LegalLayout from "@/components/conditions-utilisation/LegalLayout"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"

export default function ConditionsUtilisationPage() {
  const t = useTranslations("ConditionsUtilisationPage")
  return (
    <LegalLayout title={t("title")} lastUpdated={t("lastUpdated")}>
      <div className="space-y-8">
        {/* Section 1 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-orange-500 pl-4">
            {t("section1.title")}
          </h2>
          <div className="prose text-gray-600 leading-relaxed">
            <p className="mb-4">
              {t("section1.paragraph1")}
              <strong className="text-orange-600">
                {" "}
                {t("section1.website")}
              </strong>
              {t("section1.company")}
            </p>
            <p>{t("section1.paragraph2")}</p>
          </div>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-orange-500 pl-4">
            {t("section2.title")}
          </h2>
          <div className="bg-orange-50 p-6 rounded-lg">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  {t("section2.editor.title")}
                </h3>
                <p className="text-gray-600">
                  {t("section2.editor.companyName")}
                  <br />
                  {t("section2.editor.legalForm")}
                  <br />
                  {t("section2.editor.siret")}
                  <br />
                  {t("section2.editor.ape")}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  {t("section2.contact.title")}
                </h3>
                <p className="text-gray-600">
                  {t("section2.contact.address")}
                  <br />
                  {t("section2.contact.customerAddress")}
                  <br />
                  {t("section2.contact.phone")}
                  <br />
                  {t("section2.contact.email")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-orange-500 pl-4">
            {t("section3.title")}
          </h2>
          <div className="prose text-gray-600 leading-relaxed">
            <p className="mb-4">{t("section3.paragraph1")}</p>
            <h3 className="font-semibold text-gray-800 mb-2">
              {t("section3.subtitle")}
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t("section3.conditions.access")}</li>
              <li>{t("section3.conditions.account")}</li>
              <li>{t("section3.conditions.truthfulness")}</li>
              <li>{t("section3.conditions.uniqueAccount")}</li>
            </ul>
          </div>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-orange-500 pl-4">
            {t("section4.title")}
          </h2>
          <div className="prose text-gray-600 leading-relaxed">
            <p className="mb-4">{t("section4.paragraph1")}</p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
              <p className="font-semibold text-yellow-800 mb-2">
                {t("section4.warning")}
              </p>
              <ul className="list-disc list-inside space-y-1 text-yellow-700">
                <li>{t("section4.prohibitions.reproduction")}</li>
                <li>{t("section4.prohibitions.modification")}</li>
                <li>{t("section4.prohibitions.commercial")}</li>
                <li>{t("section4.prohibitions.scraping")}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-orange-500 pl-4">
            {t("section5.title")}
          </h2>
          <div className="prose text-gray-600 leading-relaxed">
            <h3 className="font-semibold text-gray-800 mb-2">
              {t("section5.userObligations.title")}
            </h3>
            <p className="mb-4">{t("section5.userObligations.intro")}</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>{t("section5.userObligations.respect")}</li>
              <li>{t("section5.userObligations.order")}</li>
              <li>{t("section5.userObligations.rights")}</li>
              <li>{t("section5.userObligations.confidentiality")}</li>
            </ul>

            <h3 className="font-semibold text-gray-800 mb-2">
              {t("section5.liability.title")}
            </h3>
            <p>{t("section5.liability.content")}</p>
          </div>
        </section>

        {/* Section 6 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-orange-500 pl-4">
            {t("section6.title")}
          </h2>
          <div className="prose text-gray-600 leading-relaxed">
            <p className="mb-4">{t("section6.paragraph1")}</p>
            <p>
              {t("section6.paragraph2")}
              <Link
                href="/politique-confidentialite"
                className="text-orange-600 hover:text-orange-700 font-semibold"
              >
                {t("section6.privacyPolicyLink")}
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Section 7 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-orange-500 pl-4">
            {t("section7.title")}
          </h2>
          <div className="prose text-gray-600 leading-relaxed">
            <p>{t("section7.content")}</p>
          </div>
        </section>

        {/* Section 8 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-orange-500 pl-4">
            {t("section8.title")}
          </h2>
          <div className="prose text-gray-600 leading-relaxed">
            <p>{t("section8.content")}</p>
          </div>
        </section>
      </div>
    </LegalLayout>
  )
}
