"use client"
import LegalLayout from "@/components/conditions-utilisation/LegalLayout"
import { FREE_SHIPPING_THRESHOLD } from "@/data/data"
import { useTranslations } from "next-intl"

export default function ConditionsVentePage() {
  const t = useTranslations("ConditionsVentePage")

  return (
    <LegalLayout title={t("title")} lastUpdated={t("lastUpdated")}>
      <div className="space-y-8">
        {/* Section 1 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-firstColor pl-4">
            {t("section1.title")}
          </h2>
          <div className="prose text-gray-600 leading-relaxed">
            <p>{t("section1.content")}</p>
          </div>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-firstColor pl-4">
            {t("section2.title")}
          </h2>
          <div className="prose text-gray-600 leading-relaxed">
            <h3 className="font-semibold text-gray-800 mb-2">
              {t("section2.productDescription.title")}
            </h3>
            <p className="mb-4">{t("section2.productDescription.content")}</p>

            <h3 className="font-semibold text-gray-800 mb-2">
              {t("section2.pricing.title")}
            </h3>
            <div className="bg-orange-50 p-4 rounded-lg mb-4">
              <ul className="list-disc list-inside space-y-2">
                <li>{t("section2.pricing.eurosTTC")}</li>
                <li>{t("section2.pricing.tva")}</li>
                <li>{t("section2.pricing.modification")}</li>
                <li>{t("section2.pricing.shipping")}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-firstColor pl-4">
            {t("section3.title")}
          </h2>
          <div className="prose text-gray-600 leading-relaxed">
            <h3 className="font-semibold text-gray-800 mb-2">
              {t("section3.orderProcess.title")}
            </h3>
            <ol className="list-decimal list-inside space-y-2 ml-4 mb-4">
              <li>{t("section3.orderProcess.step1")}</li>
              <li>{t("section3.orderProcess.step2")}</li>
              <li>{t("section3.orderProcess.step3")}</li>
              <li>{t("section3.orderProcess.step4")}</li>
              <li>{t("section3.orderProcess.step5")}</li>
              <li>{t("section3.orderProcess.step6")}</li>
            </ol>

            <h3 className="font-semibold text-gray-800 mb-2">
              {t("section3.paymentMethods.title")}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">
                  {t("section3.paymentMethods.securePayments")}
                </h4>
                <ul className="list-disc list-inside space-y-1 text-green-700">
                  <li>{t("section3.paymentMethods.creditCards")}</li>
                  <li>{t("section3.paymentMethods.paypal")}</li>
                  <li>{t("section3.paymentMethods.bankTransfer")}</li>
                  <li>{t("section3.paymentMethods.check")}</li>
                </ul>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">
                  {t("section3.paymentMethods.security")}
                </h4>
                <p className="text-blue-700">
                  {t("section3.paymentMethods.securityDescription")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-firstColor pl-4">
            {t("section4.title")}
          </h2>
          <div className="prose text-gray-600 leading-relaxed">
            <h3 className="font-semibold text-gray-800 mb-2">
              {t("section4.deliveryZones.title")}
            </h3>
            <p className="mb-4">{t("section4.deliveryZones.content")}</p>

            <h3 className="font-semibold text-gray-800 mb-2">
              {t("section4.deliveryTable.title")}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                <thead className="bg-orange-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-800">
                      {t("section4.deliveryTable.tableHeaders.method")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-800">
                      {t("section4.deliveryTable.tableHeaders.delay")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-800">
                      {t("section4.deliveryTable.tableHeaders.price")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-3">
                      {t("section4.deliveryTable.colissimo")}
                    </td>
                    <td className="px-4 py-3">
                      {t("section4.deliveryTable.delay23days")}
                    </td>
                    <td className="px-4 py-3">6,90€</td>
                  </tr>
                  <tr className="border-t bg-gray-50">
                    <td className="px-4 py-3">
                      {t("section4.deliveryTable.chronopost")}
                    </td>
                    <td className="px-4 py-3">
                      {t("section4.deliveryTable.delay24h")}
                    </td>
                    <td className="px-4 py-3">14,90€</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-3">
                      {t("section4.deliveryTable.pointRelais")}
                    </td>
                    <td className="px-4 py-3">
                      {t("section4.deliveryTable.delay35days")}
                    </td>
                    <td className="px-4 py-3">4,90€</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              {t("section4.deliveryTable.freeShippingNote", {
                threshold: FREE_SHIPPING_THRESHOLD
              })}
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-firstColor pl-4">
            {t("section5.title")}
          </h2>
          <div className="prose text-gray-600 leading-relaxed">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <h3 className="font-semibold text-blue-800 mb-2">
                {t("section5.legalDelay")}
              </h3>
              <p className="text-blue-700">{t("section5.legalDescription")}</p>
            </div>

            <h3 className="font-semibold text-gray-800 mb-2">
              {t("section5.returnConditions.title")}
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t("section5.returnConditions.originalPackaging")}</li>
              <li>{t("section5.returnConditions.unused")}</li>
              <li>{t("section5.returnConditions.labelsIncluded")}</li>
              <li>{t("section5.returnConditions.form")}</li>
            </ul>
          </div>
        </section>

        {/* Section 6 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-firstColor pl-4">
            {t("section6.title")}
          </h2>
          <div className="prose text-gray-600 leading-relaxed">
            <h3 className="font-semibold text-gray-800 mb-2">
              {t("section6.legalWarranty.title")}
            </h3>
            <p className="mb-4">{t("section6.legalWarranty.content")}</p>

            <h3 className="font-semibold text-gray-800 mb-2">
              {t("section6.customerService.title")}
            </h3>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="mb-2">{t("section6.customerService.intro")}</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t("section6.customerService.email")}</li>
                <li>{t("section6.customerService.phone")}</li>
                <li>{t("section6.customerService.responseTime")}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 7 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-firstColor pl-4">
            {t("section7.title")}
          </h2>
          <div className="prose text-gray-600 leading-relaxed">
            <p>{t("section7.content")}</p>
          </div>
        </section>
      </div>
    </LegalLayout>
  )
}
