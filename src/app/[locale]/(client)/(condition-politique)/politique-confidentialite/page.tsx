"use client"
import LegalLayout from "@/components/conditions-utilisation/LegalLayout"
import { useTranslations } from "next-intl"

export default function PolitiqueConfidentialitePage() {
  const t = useTranslations("PolitiqueConfidentialitePage")

  return (
    <LegalLayout title={t("title")} lastUpdated={t("lastUpdated")}>
      <div className="space-y-8">
        {/* Intro */}
        <section>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <h2 className="text-xl font-bold text-blue-800 mb-2">
              {t("intro.title")}
            </h2>
            <p className="text-blue-700">{t("intro.description")}</p>
          </div>
        </section>

        {/* Section 1 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-firstColor pl-4">
            {t("section1.title")}
          </h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="mb-4">
              <strong>{t("section1.label")}</strong>
            </p>
            <div className="text-gray-700">
              {t("section1.companyName")}
              <br />
              {t("section1.address")}
              <br />
              {t("section1.email")}
              <br />
              {t("section1.phone")}
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-firstColor pl-4">
            {t("section2.title")}
          </h2>
          <div className="prose text-gray-600 leading-relaxed">
            <h3 className="font-semibold text-gray-800 mb-2">
              {t("section2.identification.title")}
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>{t("section2.identification.name")}</li>
              <li>{t("section2.identification.email")}</li>
              <li>{t("section2.identification.customerPhone")}</li>
              <li>{t("section2.identification.postalAddress")}</li>
              <li>{t("section2.identification.birthDate")}</li>
            </ul>

            <h3 className="font-semibold text-gray-800 mb-2">
              {t("section2.navigation.title")}
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>{t("section2.navigation.ipAddress")}</li>
              <li>{t("section2.navigation.browserType")}</li>
              <li>{t("section2.navigation.pagesVisited")}</li>
              <li>{t("section2.navigation.cookies")}</li>
            </ul>

            <h3 className="font-semibold text-gray-800 mb-2">
              {t("section2.commercial.title")}
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t("section2.commercial.orderHistory")}</li>
              <li>{t("section2.commercial.productPreferences")}</li>
              <li>{t("section2.commercial.shoppingCart")}</li>
              <li>{t("section2.commercial.reviews")}</li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-firstColor pl-4">
            {t("section3.title")}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">
                {t("section3.necessary.title")}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-green-700">
                <li>{t("section3.necessary.orderManagement")}</li>
                <li>{t("section3.necessary.productDelivery")}</li>
                <li>{t("section3.necessary.billing")}</li>
                <li>{t("section3.necessary.customerService")}</li>
                <li>{t("section3.necessary.returnManagement")}</li>
              </ul>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-800 mb-2">
                {t("section3.consent.title")}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-orange-700">
                <li>{t("section3.consent.newsletter")}</li>
                <li>{t("section3.consent.recommendations")}</li>
                <li>{t("section3.consent.marketing")}</li>
                <li>{t("section3.consent.advertisingCookies")}</li>
                <li>{t("section3.consent.socialNetworks")}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-firstColor pl-4">
            {t("section4.title")}
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300 rounded-lg">
              <thead className="bg-orange-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">
                    {t("section4.tableHeaders.treatment")}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">
                    {t("section4.tableHeaders.legalBasis")}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">
                    {t("section4.tableHeaders.duration")}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-3">{t("section4.orderManagement")}</td>
                  <td className="px-4 py-3">
                    {t("section4.contractExecution")}
                  </td>
                  <td className="px-4 py-3">{t("section4.fiveYears")}</td>
                </tr>
                <tr className="border-t bg-gray-50">
                  <td className="px-4 py-3">{t("section4.directMarketing")}</td>
                  <td className="px-4 py-3">{t("section4.consent")}</td>
                  <td className="px-4 py-3">{t("section4.untilWithdrawal")}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-3">{t("section4.accounting")}</td>
                  <td className="px-4 py-3">{t("section4.legalObligation")}</td>
                  <td className="px-4 py-3">{t("section4.tenYears")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-firstColor pl-4">
            {t("section5.title")}
          </h2>
          <div className="prose text-gray-600 leading-relaxed">
            <h3 className="font-semibold text-gray-800 mb-2">
              {t("section5.subtitle")}
            </h3>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <h4 className="font-semibold text-green-800 mb-2">
                  {t("section5.essential.title")}
                </h4>
                <p className="text-sm text-green-700">
                  {t("section5.essential.description")}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <h4 className="font-semibold text-blue-800 mb-2">
                  {t("section5.analytics.title")}
                </h4>
                <p className="text-sm text-blue-700">
                  {t("section5.analytics.description")}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <h4 className="font-semibold text-purple-800 mb-2">
                  {t("section5.marketing.title")}
                </h4>
                <p className="text-sm text-purple-700">
                  {t("section5.marketing.description")}
                </p>
              </div>
            </div>

            <p className="mb-4">{t("section5.cookieManagement")}</p>
          </div>
        </section>

        {/* Section 6 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-firstColor pl-4">
            {t("section6.title")}
          </h2>
          <div className="prose text-gray-600 leading-relaxed">
            <p className="mb-4">{t("section6.intro")}</p>

            <h3 className="font-semibold text-gray-800 mb-2">
              {t("section6.serviceProviders.title")}
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>{t("section6.serviceProviders.carriers")}</strong>
                </li>
                <li>
                  <strong>{t("section6.serviceProviders.payment")}</strong>
                </li>
                <li>
                  <strong>{t("section6.serviceProviders.email")}</strong>
                </li>
                <li>
                  <strong>{t("section6.serviceProviders.hosting")}</strong>
                </li>
              </ul>
            </div>

            <h3 className="font-semibold text-gray-800 mb-2">
              {t("section6.legalObligations.title")}
            </h3>
            <p>{t("section6.legalObligations.description")}</p>
          </div>
        </section>

        {/* Section 7 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-firstColor pl-4">
            {t("section7.title")}
          </h2>
          <div className="prose text-gray-600 leading-relaxed">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">
                  {t("section7.technical.title")}
                </h3>
                <ul className="list-disc list-inside space-y-1 text-green-700">
                  <li>{t("section7.technical.sslEncryption")}</li>
                  <li>{t("section7.technical.secureServers")}</li>
                  <li>{t("section7.technical.regularBackups")}</li>
                  <li>{t("section7.technical.firewall")}</li>
                  <li>{t("section7.technical.restrictedAccess")}</li>
                </ul>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">
                  {t("section7.organizational.title")}
                </h3>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>{t("section7.organizational.staffTraining")}</li>
                  <li>{t("section7.organizational.passwordPolicy")}</li>
                  <li>{t("section7.organizational.securityAudit")}</li>
                  <li>{t("section7.organizational.breachProcedure")}</li>
                  <li>
                    {t("section7.organizational.confidentialityContracts")}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 8 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-firstColor pl-4">
            {t("section8.title")}
          </h2>
          <div className="prose text-gray-600 leading-relaxed">
            <p className="mb-4">{t("section8.intro")}</p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-secondColor font-bold text-sm">
                      👁
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {t("section8.rights.access.title")}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t("section8.rights.access.description")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-secondColor font-bold text-sm">
                      ✏️
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {t("section8.rights.rectification.title")}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t("section8.rights.rectification.description")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-secondColor font-bold text-sm">
                      🗑
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {t("section8.rights.erasure.title")}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t("section8.rights.erasure.description")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-secondColor font-bold text-sm">
                      ⏸
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {t("section8.rights.restriction.title")}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t("section8.rights.restriction.description")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-secondColor font-bold text-sm">
                      📦
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {t("section8.rights.portability.title")}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t("section8.rights.portability.description")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-secondColor font-bold text-sm">
                      🚫
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {t("section8.rights.objection.title")}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t("section8.rights.objection.description")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-secondColor font-bold text-sm">
                      🤖
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {t("section8.rights.automaticDecision.title")}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t("section8.rights.automaticDecision.description")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-secondColor font-bold text-sm">
                      ❌
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {t("section8.rights.consentWithdrawal.title")}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t("section8.rights.consentWithdrawal.description")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mt-6">
              <h3 className="font-semibold text-orange-800 mb-2">
                {t("section8.exercise.title")}
              </h3>
              <p className="text-orange-700 mb-2">
                {t("section8.exercise.intro")}
              </p>
              <ul className="list-disc list-inside space-y-1 text-orange-700">
                <li>{t("section8.exercise.email")}</li>
                <li>{t("section8.exercise.mail")}</li>
                <li>{t("section8.exercise.responseTime")}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 9 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-firstColor pl-4">
            {t("section9.title")}
          </h2>
          <div className="prose text-gray-600 leading-relaxed">
            <p className="mb-4">{t("section9.intro")}</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t("section9.adequateLevel")}</li>
              <li>{t("section9.appropriateGuarantees")}</li>
              <li>{t("section9.explicitConsent")}</li>
            </ul>
          </div>
        </section>

        {/* Section 10 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-firstColor pl-4">
            {t("section10.title")}
          </h2>
          <div className="prose text-gray-600 leading-relaxed">
            <p>{t("section10.content")}</p>
          </div>
        </section>

        {/* Section 11 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-firstColor pl-4">
            {t("section11.title")}
          </h2>
          <div className="prose text-gray-600 leading-relaxed">
            <p>{t("section11.content")}</p>
          </div>
        </section>

        {/* Section 12 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-firstColor pl-4">
            {t("section12.title")}
          </h2>
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <h3 className="font-semibold text-red-800 mb-2">
              {t("section12.authority.title")}
            </h3>
            <p className="text-red-700 mb-2">
              {t("section12.authority.intro")}
            </p>
            <div className="text-red-700">
              <strong>{t("section12.authority.name")}</strong>
              <br />
              {t("section12.authority.address")}
              <br />
              {t("section12.authority.customerAddress")}
              <br />
              {t("section12.authority.phone")}
              <br />
              {t("section12.authority.website")}
            </div>
          </div>
        </section>
      </div>
    </LegalLayout>
  )
}
