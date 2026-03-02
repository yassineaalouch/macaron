import { Product } from "@/types/product"

export const FREE_SHIPPING_THRESHOLD = 1000 // en DH
export const productsListDemo: Product[] = [
  {
    _id: "1",
    name: {
      ar: "ؤاعبا نتيبا بنابش نبتلابلاب نمبابب",
      fr: "Bobines de fil multicolores"
    },
    description: {
      ar: "ؤاعبا نتيبا بنابش نبتلابلاب نمبابب",
      fr: "Un assortiment de belles bobines de fil multicolores, parfaites pour tous vos projets de couture."
    },
    price: 25,
    originalPrice: 30,
    images: [
      "https://static.mapetitemercerie.com/98636-large_default/poincon-pour-pose-rivets-oeillets-boutons-couture-loisirs.jpg"
    ],
    category: {
      _id: "cat1",
      name: { fr: "Accessoires de Couture", ar: "إكسسوارات الخياطة" },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    discount: {
      _id: "disc1",
      name: { fr: "Promotion 10%", ar: "تخفيض 10%" },
      type: "PERCENTAGE",
      value: 10,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    Characteristic: [
      {
        _id: "c1",
        name: {
          _id: "68fcc6f03124d8faea297cb3",
          name: { fr: "color", ar: "أبيض" },
          values: [
            { name: { fr: "Polyester", ar: "بوليستر" } },
            { name: { fr: "Coton", ar: "قطن" } }
          ]
        },
        values: [
          { fr: "Multicolore", ar: "متعدد الألوان" },
          { fr: "Blanc", ar: "أبيض" }
        ]
      },
      {
        _id: "c2",
        name: {
          _id: "68fcc6f03124d8faea297cb3",
          name: { fr: "color", ar: "أبيض" },
          values: [
            { name: { fr: "Polyester", ar: "بوليستر" } },
            { name: { fr: "Coton", ar: "قطن" } }
          ]
        },
        values: [
          { fr: "Polyester", ar: "بوليستر" },
          { fr: "Coton", ar: "قطن" }
        ]
      }
    ],
    inStock: true,
    quantity: 20,
    isNewProduct: false,
    isOnSale: true,
    slug: "bobines-de-fil-multicolores",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: "2",
    name: {
      ar: "ؤاعبا نتيبا بنابش نبتلابلاب نمبابب",
      fr: "Fournitures de couture"
    },
    description: {
      ar: "ؤاعبا نتيبا بنابش نبتلابلاب نمبابب",
      fr: "Collection d’outils de couture (fils, boutons, etc.) idéale pour atelier et DIY."
    },
    price: 40,
    images: [
      "https://static.mapetitemercerie.com/241747-large_default/ciseaux-classic-cranteurs-23-cm-droitier-fiskars.jpg"
    ],
    category: {
      _id: "cat1",
      name: { fr: "Accessoires de Couture", ar: "إكسسوارات الخياطة" },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    Characteristic: [
      {
        _id: "c3",
        name: {
          _id: "68fcc6f03124d8faea297cb3",
          name: { fr: "color", ar: "أبيض" },
          values: [
            { name: { fr: "Polyester", ar: "بوليستر" } },
            { name: { fr: "Coton", ar: "قطن" } }
          ]
        },
        values: [{ fr: "Multicolore", ar: "متعدد الألوان" }]
      },
      {
        _id: "c4",
        name: {
          _id: "68fcc6f03124d8faea297cb3",
          name: { fr: "color", ar: "أبيض" },
          values: [
            { name: { fr: "Polyester", ar: "بوليستر" } },
            { name: { fr: "Coton", ar: "قطن" } }
          ]
        },
        values: [{ fr: "Mix", ar: "خليط" }]
      }
    ],
    inStock: true,
    quantity: 50,
    isNewProduct: false,
    isOnSale: false,
    slug: "fournitures-de-couture",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: "3",
    name: {
      ar: "ؤاعبا نتيبا بنابش نبتلابلاب نمبابب",
      fr: "Fils colorés dans un tiroir"
    },
    description: {
      ar: "ؤاعبا نتيبا بنابش نبتلابلاب نمبابب",
      fr: "Vue rapprochée de fils à coudre colorés bien rangés dans un tiroir."
    },
    price: 30,
    images: [
      "https://static.mapetitemercerie.com/99298-large_default/kit-de-11-fils-a-coudre-guetermann-accessoires.jpg"
    ],
    category: {
      _id: "cat1",
      name: { fr: "Accessoires de Couture", ar: "إكسسوارات الخياطة" },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    Characteristic: [
      {
        _id: "c5",
        name: {
          _id: "68fcc6f03124d8faea297cb3",
          name: { fr: "color", ar: "أبيض" },
          values: [
            { name: { fr: "Polyester", ar: "بوليستر" } },
            { name: { fr: "Coton", ar: "قطن" } }
          ]
        },
        values: [{ fr: "Multicolore", ar: "متعدد الألوان" }]
      },
      {
        _id: "c6",
        name: {
          _id: "68fcc6f03124d8faea297cb3",
          name: { fr: "color", ar: "أبيض" },
          values: [
            { name: { fr: "Polyester", ar: "بوليستر" } },
            { name: { fr: "Coton", ar: "قطن" } }
          ]
        },
        values: [{ fr: "Coton", ar: "قطن" }]
      }
    ],
    inStock: true,
    quantity: 70,
    isNewProduct: true,
    isOnSale: false,
    slug: "fils-colores-dans-un-tiroir",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: "4",
    name: {
      ar: "ؤاعبا نتيبا بنابش نبتلابلاب نمبابب",
      fr: "Tissus assortis colorés"
    },
    description: {
      ar: "ؤاعبا نتيبا بنابش نبتلابلاب نمبابب",
      fr: "Collection de tissus 100% coton, idéals pour patchwork, quilting et projets créatifs."
    },
    price: 35,
    images: [
      "https://static.mapetitemercerie.com/48913-large_default/machine-a-coudre-smarter-260c-pfaff.jpg"
    ],
    category: {
      _id: "cat2",
      name: { fr: "Tissus", ar: "أقمشة" },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    Characteristic: [
      {
        _id: "c7",
        name: {
          _id: "68fcc6f03124d8faea297cb3",
          name: { fr: "color", ar: "أبيض" },
          values: [
            { name: { fr: "Polyester", ar: "بوليستر" } },
            { name: { fr: "Coton", ar: "قطن" } }
          ]
        },
        values: [{ fr: "Multicolore", ar: "متعدد الألوان" }]
      },
      {
        _id: "c8",
        name: {
          _id: "68fcc6f03124d8faea297cb3",
          name: { fr: "color", ar: "أبيض" },
          values: [
            { name: { fr: "Polyester", ar: "بوليستر" } },
            { name: { fr: "Coton", ar: "قطن" } }
          ]
        },
        values: [{ fr: "Coton", ar: "قطن" }]
      }
    ],
    inStock: true,
    quantity: 80,
    isNewProduct: false,
    isOnSale: false,
    slug: "tissus-assortis-colores",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]
