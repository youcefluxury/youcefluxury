import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { STORE } from "@/lib/store-data";

/* ------------------------------------------------------------------ */
/* Languages                                                           */
/* ------------------------------------------------------------------ */

export type Lang = "ar" | "en";

/**
 * Every user-facing string of the storefront and the dashboard.
 * Arabic is the default language, English is a full translation —
 * never a mix of both inside the same sentence.
 */
const STRINGS = {
  /* ---- shared ---------------------------------------------------- */
  "common.home": { ar: "الرئيسية", en: "Home" },
  "common.shop": { ar: "المتجر", en: "Shop" },
  "common.categories": { ar: "التصنيفات", en: "Categories" },
  "common.allProducts": { ar: "كل المنتجات", en: "All products" },
  "common.search": { ar: "بحث", en: "Search" },
  "common.searchPlaceholder": {
    ar: "ابحث عن منتج…",
    en: "Search for a product…",
  },
  "common.cart": { ar: "سلة الشراء", en: "Shopping bag" },
  "common.menu": { ar: "القائمة", en: "Menu" },
  "common.account": { ar: "لوحة التحكم", en: "Admin panel" },
  "common.viewAll": { ar: "عرض الكل", en: "View all" },
  "common.showMore": { ar: "عرض المزيد", en: "Show more" },
  "common.back": { ar: "رجوع", en: "Back" },
  "common.reset": { ar: "إعادة تعيين", en: "Reset" },
  "common.language": { ar: "تغيير اللغة", en: "Change language" },
  "common.close": { ar: "إغلاق", en: "Close" },
  "common.instagram": { ar: "إنستغرام", en: "Instagram" },
  "common.facebook": { ar: "فايسبوك", en: "Facebook" },
  "card.actions": { ar: "خيارات البطاقة", en: "Card actions" },
  "card.edit": { ar: "تعديل المنتج", en: "Edit product" },
  "card.delete": { ar: "حذف المنتج", en: "Delete product" },
  "card.editCategory": { ar: "تعديل التصنيف", en: "Edit category" },
  "card.deleteCategory": { ar: "حذف التصنيف", en: "Delete category" },
  "card.markSoldOut": { ar: "تعليم كنفذت الكمية", en: "Mark as sold out" },
  "card.markAvailable": { ar: "إرجاعه كمتوفر", en: "Mark as available" },
  "card.markedSoldOut": { ar: "تم تعليم المنتج كنفذت الكمية", en: "Marked as sold out" },
  "card.markedAvailable": { ar: "المنتج متوفر الآن", en: "Product is available again" },
  "addProduct.open": { ar: "إضافة منتج في هذا التصنيف", en: "Add a product to this category" },
  "addCategory.open": { ar: "إضافة تصنيف جديد", en: "Add a new category" },
  "addSlide.open": { ar: "إضافة شريحة جديدة للسلايدر", en: "Add a new slider slide" },
  "common.whatsapp": { ar: "واتساب", en: "WhatsApp" },
  "common.whatsappAria": { ar: "اتصل بنا على واتساب", en: "Contact us on WhatsApp" },
  "common.phone": { ar: "الهاتف", en: "Phone" },
  "common.phoneAria": { ar: "اتصل بنا هاتفياً", en: "Call us" },
  "common.save": { ar: "حفظ", en: "Save" },
  "common.deliveryPrices": { ar: "أسعار التوصيل", en: "Delivery prices" },
  "common.deliveryNote": {
    ar: "توصيل إلى 69 ولاية │ الدفع عند الاستلام",
    en: "Delivery to 69 wilayas │ Cash on delivery",
  },
  "meta.title": {
    ar: "{store} — ملابس وأزياء الرجال في الجزائر",
    en: "{store} — Men's fashion boutique in Algeria",
  },

  /* ---- hero slider ----------------------------------------------- */
  "hero.cta": { ar: "اكتشف", en: "Discover" },
  "hero.previous": { ar: "الشريحة السابقة", en: "Previous slide" },
  "hero.next": { ar: "الشريحة التالية", en: "Next slide" },
  "hero.slide": { ar: "الشريحة {n}", en: "Slide {n}" },
  "hero.replace": { ar: "استبدال الصورة", en: "Replace image" },
  "hero.carousel": { ar: "معرض التشكيلات", en: "Collection carousel" },
  "hero.slide1.title": { ar: "تي شيرت أوفرسايز", en: "T-Shirt Oversize" },
  "hero.slide2.title": { ar: "هودي ثقيل", en: "Heavyweight Hoodie" },
  "hero.slide3.title": { ar: "سراويل واسعة", en: "Baggy & Boyfriend" },

  /* ---- home ------------------------------------------------------ */
  "benefit.delivery": { ar: "توصيل 69 ولاية", en: "Delivery to 69 wilayas" },
  "benefit.cod": { ar: "الدفع عند الاستلام", en: "Cash on delivery" },
  "benefit.exchange": { ar: "تبديل خلال 48 ساعة", en: "48h exchange" },
  "benefit.original": { ar: "منتجات أصلية 100%", en: "100% original pieces" },
  "home.categoriesTitle": { ar: "تصنيفاتنا", en: "Our categories" },
  "home.productsEyebrow": { ar: "الأكثر طلباً", en: "Most wanted" },
  "home.productsTitle": { ar: "منتجاتنا المميزة", en: "Featured products" },
  "home.map.title": { ar: "أين تجدنا", en: "Find us" },

  /* ---- shop ------------------------------------------------------ */
  "shop.subtitle": { ar: "كل القطع المتوفرة", en: "Every available piece" },
  "shop.all": { ar: "الكل", en: "All" },
  "shop.sort": { ar: "ترتيب", en: "Sort" },
  "shop.sortNew": { ar: "الأحدث", en: "Newest" },
  "shop.sortPriceAsc": { ar: "السعر: من الأقل", en: "Price: low to high" },
  "shop.sortPriceDesc": { ar: "السعر: من الأعلى", en: "Price: high to low" },
  "shop.searchPlaceholder": { ar: "ابحث…", en: "Search…" },
  "shop.count": { ar: "{n} منتج", en: "{n} products" },
  "shop.emptyTitle": { ar: "لا توجد نتائج", en: "No results" },
  "shop.emptyBody": {
    ar: "جرّب تغيير التصنيف أو البحث بكلمة أخرى.",
    en: "Try another category or search for a different word.",
  },

  /* ---- category page --------------------------------------------- */
  "category.eyebrow": { ar: "تصنيف", en: "Category" },
  "category.products": {
    ar: "{n} منتج في هذا التصنيف",
    en: "{n} products in this category",
  },
  "category.emptyTitle": {
    ar: "لا توجد منتجات في هذا التصنيف بعد",
    en: "No products in this category yet",
  },
  "category.emptyBody": {
    ar: "نضيف قطعاً جديدة باستمرار — تابعنا قريباً.",
    en: "We keep adding new pieces — check back soon.",
  },
  "category.notFound": {
    ar: "هذا التصنيف غير متوفر",
    en: "This category is unavailable",
  },
  "category.notFoundBody": {
    ar: "ربما حذفه المتجر — تصفّح بقية التصنيفات أو كل المنتجات.",
    en: "It may have been removed — browse the other categories or all products.",
  },
  "category.otherTitle": { ar: "تصنيفات أخرى", en: "Other categories" },
  "category.galleryEyebrow": { ar: "لقطات", en: "Snapshots" },
  "category.galleryTitle": { ar: "صور من التصنيف", en: "Photos from this category" },
  "category.galleryLead": {
    ar: "لمحة سريعة عن قطع هذا التصنيف.",
    en: "A quick look at the pieces in this category.",
  },

  /* ---- product --------------------------------------------------- */
  "product.soldOut": { ar: "نفذت الكمية", en: "Sold out" },
  "product.promo": { ar: "تخفيض", en: "Sale" },
  "product.quickAdd": { ar: "إضافة سريعة", en: "Quick add" },
  "product.sizesCount": { ar: "{n} مقاس", en: "{n} sizes" },
  "product.sizesAvailable": { ar: "{n} متوفر", en: "{n} in stock" },
  "product.notFound": { ar: "المنتج غير موجود", en: "Product not found" },
  "product.backToShop": { ar: "رجوع إلى المتجر", en: "Back to the shop" },
  "product.chooseSize": { ar: "اختر المقاس أولاً", en: "Please choose a size first" },
  "product.added": { ar: "أضيف إلى السلة", en: "Added to your bag" },
  "product.color": { ar: "اللون", en: "Colour" },
  "product.size": { ar: "المقاس", en: "Size" },
  "product.addToCart": { ar: "أضف للسلة", en: "Add to bag" },
  "product.buyNow": { ar: "اشتري الآن", en: "Buy now" },
  "product.buyNowTitle": { ar: "كيف تريد إتمام طلبك؟", en: "How do you want to order?" },
  "product.viaInstagram": { ar: "عبر إنستغرام", en: "Via Instagram" },
  "product.viaInstagramNote": {
    ar: "رسالة طلبك جاهزة في محادثتنا — اضغط إرسال فقط",
    en: "Your order message is ready in our chat — just press Send",
  },
  "product.instantDelivery": { ar: "توصيل فوري", en: "Instant delivery" },
  "product.instantDeliveryNote": {
    ar: "أكمل نموذج الطلب وسنتصل بك للتأكيد",
    en: "Complete the order form and we will call you to confirm",
  },
  "product.save": { ar: "وفّر {amount}", en: "Save {amount}" },
  "product.delivery": { ar: "توصيل 69 ولاية", en: "Delivery to 69 wilayas" },
  "product.cod": { ar: "دفع عند الاستلام", en: "Pay on delivery" },
  "product.yourSize": { ar: "مقاسك: {size}", en: "Your size: {size}" },
  "product.sizeGuideHint": {
    ar: "جدول المقاسات بالأسفل",
    en: "See the size guide below",
  },
  "product.sizeGuideTitle": { ar: "جدول المقاسات التوضيحي", en: "Size guide" },
  "product.sizeGuideEyebrow": { ar: "القياسات بالسنتيمتر", en: "Measurements in cm" },
  "product.colSize": { ar: "المقاس", en: "Size" },
  "product.colWaist": { ar: "A — محيط الخصر", en: "A — Waist" },
  "product.colLength": { ar: "B — الطول الكلي", en: "B — Total length" },
  "product.sizeGuideNote": {
    ar: "القياسات تقريبية (± 1 cm) ومأخوذة على القطعة المسطحة. إذا كنت بين مقاسين، اختر المقاس الأكبر لإطلالة واسعة.",
    en: "Measurements are approximate (± 1 cm) and taken flat. Between two sizes, take the larger one for a relaxed fit.",
  },
  "product.related": { ar: "قد يعجبك أيضاً", en: "You may also like" },
  "product.relatedEyebrow": { ar: "نفس الأسلوب", en: "Same style" },
  "product.imageAlt": { ar: "صورة {n}", en: "View {n}" },
  "product.addPhoto": { ar: "إضافة صورة أخرى", en: "Add another photo" },
  "product.managePhotos": { ar: "صور هذا المنتج", en: "Photos of this product" },
  "product.photosHint": {
    ar: "الصورة الأولى هي الغلاف في بطاقة المنتج. اختر لوناً واحداً لكل صورة، وعندما يضغط الزبون على هذا اللون تظهر له صورته مباشرة. ＋ لإضافة صورة و× لحذفها.",
    en: "The first photo is the card cover. Give each photo a single colour — tapping that colour shows the shopper that photo right away. ＋ adds a photo, × removes it.",
  },
  "product.photoColor": { ar: "لون الصورة", en: "Photo colour" },
  "product.sizesForColor": {
    ar: "مقاسات هذه الصورة ({color}) — كل صورة لها مقاساتها",
    en: "Sizes of this photo ({color}) — each photo has its own",
  },
  "product.newPhotoColor": {
    ar: "لون الصور التي ستضيفها",
    en: "Colour of the photos you add",
  },
  "product.previousPhoto": { ar: "الصورة السابقة", en: "Previous photo" },
  "product.nextPhoto": { ar: "الصورة التالية", en: "Next photo" },
  "product.coverTag": { ar: "الغلاف", en: "Cover" },
  "product.photosSaved": { ar: "تم حفظ صور المنتج", en: "Product photos saved" },
  "product.photoRequired": {
    ar: "المنتج يحتاج صورة واحدة على الأقل",
    en: "The product needs at least one photo",
  },
  "product.quantityMinus": { ar: "أنقص الكمية", en: "Decrease quantity" },
  "product.quantityPlus": { ar: "أضف الكمية", en: "Increase quantity" },

  /* ---- cart & checkout ------------------------------------------- */
  "cart.title": { ar: "سلة الشراء", en: "Your bag" },
  "cart.items": { ar: "{n} قطعة", en: "{n} items" },
  "cart.itemOne": { ar: "قطعة واحدة", en: "1 item" },
  "cart.recorded": { ar: "تم تسجيل طلبك", en: "Order recorded" },
  "cart.empty": { ar: "سلتك فارغة", en: "Your bag is empty" },
  "cart.emptyBody": {
    ar: "اكتشف تشكيلتنا الجديدة وأضف قطعتك المفضلة.",
    en: "Explore the new drop and add your favourite piece.",
  },
  "cart.emptyCta": { ar: "اكتشف المنتجات", en: "Browse products" },
  "cart.remove": { ar: "حذف", en: "Remove" },
  "cart.subtotal": { ar: "المجموع الفرعي", en: "Subtotal" },
  "cart.deliveryByWilaya": {
    ar: "يُحسب حسب الولاية",
    en: "Calculated from your wilaya",
  },
  "cart.deliveryToWilaya": {
    ar: "التوصيل إلى {wilaya}",
    en: "Delivery to {wilaya}",
  },
  "cart.deliveryNote": {
    ar: "رسوم التوصيل حسب الولاية",
    en: "Delivery fee depends on the wilaya",
  },
  "cart.checkout": { ar: "إتمام الطلب", en: "Checkout" },
  "cart.placeOrder": { ar: "اطلب الآن", en: "Place order" },
  "cart.thanksTitle": { ar: "شكراً لك، تم استلام طلبك", en: "Thank you, your order is in" },
  "cart.thanksBody": {
    ar: "سنتصل بك لتأكيد الطلب. رقم الطلب:",
    en: "We will call you to confirm. Your order number:",
  },
  "cart.total": { ar: "المجموع", en: "Total" },
  "cart.confirmWhatsapp": { ar: "تأكيد عبر واتساب", en: "Confirm on WhatsApp" },
  "cart.continue": { ar: "متابعة التسوق", en: "Continue shopping" },
  "cart.chooseWilaya": { ar: "اختر الولاية", en: "Please choose a wilaya" },
  "cart.sendError": { ar: "تعذر إرسال الطلب", en: "Could not send your order" },
  "cart.sendErrorHint": {
    ar: "تحقق من اتصالك بالإنترنت وحاول مرة أخرى، وإن تكررت المشكلة راسلنا على واتساب أو اتصل بنا.",
    en: "Check your connection and try again — if it keeps happening, message us on WhatsApp or call us.",
  },
  "cart.sent": { ar: "تم إرسال الطلب", en: "Order sent" },
  "cart.whatsappMessage": {
    ar: "مرحبا {store}، رقم طلبي هو {reference}",
    en: "Hello {store}, my order number is {reference}",
  },
  "cart.confirmInstagram": { ar: "إرسال الطلب عبر إنستغرام", en: "Send order via Instagram" },
  "cart.openedInstagram": {
    ar: "فتحنا حسابنا على إنستغرام ونسخنا طلبك — الصقه في المحادثة وأرسله",
    en: "Our Instagram is open and your order is copied — paste it in the chat and send",
  },
  "cart.channelTitle": { ar: "كيف تريد إتمام طلبك؟", en: "How do you want to order?" },
  "cart.channelSite": { ar: "من الموقع مباشرة", en: "Directly on the site" },
  "cart.channelSiteNote": {
    ar: "يُسجَّل طلبك ونتصل بك للتأكيد",
    en: "Your order is recorded and we call you to confirm",
  },
  "cart.channelInstagram": { ar: "عبر إنستغرام", en: "Via Instagram" },
  "cart.channelInstagramNote": {
    ar: "يُفتح حسابنا بالكامل مع طلبك — الصقه في المحادثة وأرسله",
    en: "Our account opens with your whole order — paste it in the chat and send",
  },
  "cart.instagramHint": {
    ar: "يفتح إنستغرام على حسابنا مع نسخ طلبك — الصقه في المحادثة وأرسله.",
    en: "Opens Instagram on our account and copies your order — paste it in the chat and send.",
  },
  "cart.sizeLabel": { ar: "المقاس {size}", en: "Size {size}" },
  "cart.summary": { ar: "ملخص الطلب", en: "Order summary" },
  "cart.orderNumber": { ar: "رقم الطلب", en: "Order number" },
  "cart.delivery": { ar: "التوصيل", en: "Delivery" },
  "cart.deliveryAddress": { ar: "عنوان التوصيل", en: "Delivery address" },
  "cart.callConfirm": {
    ar: "سنتصل بكم لتأكيد طلبكم. للاستفسار اتصلوا على {phone}.",
    en: "We will call you to confirm your order. For any question, call {phone}.",
  },

  /* ---- forms ----------------------------------------------------- */
  "form.fullName": { ar: "الاسم الكامل", en: "Full name" },
  "form.fullNamePlaceholder": {
    ar: "اكتب اسمك الكامل هنا",
    en: "Type your full name here",
  },
  "form.phonePlaceholder": {
    ar: "أدخل رقم هاتفك للتواصل",
    en: "Enter the phone number we can call",
  },
  "form.phone": { ar: "رقم الهاتف", en: "Phone number" },
  "form.wilaya": { ar: "الولاية", en: "Wilaya" },
  "form.wilayaPlaceholder": {
    ar: "حدّد ولايتك من القائمة",
    en: "Select your wilaya from the list",
  },
  "form.address": { ar: "العنوان بالتفصيل", en: "Full address" },
  "form.addressPlaceholder": {
    ar: "البلدية، الحي، الشارع وأقرب نقطة معروفة",
    en: "Commune, area, street and a nearby landmark",
  },
  "form.note": { ar: "ملاحظة (اختياري)", en: "Note (optional)" },
  "form.notePlaceholder": {
    ar: "هل من تفاصيل إضافية تخصّ التوصيل؟",
    en: "Anything else we should know for delivery?",
  },
  "form.payment": { ar: "طريقة الدفع", en: "Payment method" },
  "checkout.cod": { ar: "الدفع عند الاستلام", en: "Cash on delivery" },

  /* ---- footer ---------------------------------------------------- */
  "footer.about": {
    ar: "متجر جزائري متخصص في ملابس وأزياء الرجال: تي شيرت أوفرسايز، هودي، سراويل واسعة، أطقم وأحذية بأسلوب شارع أنيق.",
    en: "An Algerian menswear boutique: oversize tees, hoodies, baggy pants, full sets and shoes with a clean streetwear feel.",
  },
  "footer.service": { ar: "الخدمة", en: "Service" },
  "footer.contact": { ar: "تواصل", en: "Contact" },
  "footer.delivery": { ar: "توصيل إلى 69 ولاية", en: "Delivery to all 69 wilayas" },
  "footer.deliveryPrices": {
    ar: "تعرّف على أسعار التوصيل لكل ولاية",
    en: "See the delivery price of every wilaya",
  },
  "footer.cod": { ar: "الدفع عند الاستلام", en: "Cash on delivery" },
  "footer.hours": {
    ar: "من السبت إلى الخميس · 9:00 — 19:00",
    en: "Saturday to Thursday · 9:00 — 19:00",
  },
  "footer.rights": {
    ar: "© {year} {store} — كل الحقوق محفوظة",
    en: "© {year} {store} — All rights reserved",
  },

  /* ---- delivery prices ------------------------------------------- */
  "delivery.eyebrow": { ar: "التوصيل", en: "Delivery" },
  "delivery.title": {
    ar: "أسعار التوصيل إلى 69 ولاية",
    en: "Delivery prices to 69 wilayas",
  },
  "delivery.lead": {
    ar: "اختر ولايتك عند إتمام الطلب ويُحتسب سعر التوصيل تلقائياً مع المجموع النهائي، والدفع عند الاستلام في كل الولايات.",
    en: "Pick your wilaya at checkout and the delivery fee is added to your total automatically. Cash on delivery in every wilaya.",
  },
  "delivery.defaultTitle": { ar: "السعر الافتراضي", en: "Default price" },
  "delivery.defaultHint": {
    ar: "يُطبّق على كل ولاية لم تُحدَّد لها تسعيرة خاصة.",
    en: "Applies to every wilaya without its own price.",
  },
  "delivery.search": { ar: "ابحث عن ولايتك…", en: "Search your wilaya…" },
  "delivery.results": { ar: "{n} ولاية", en: "{n} wilayas" },
  "delivery.empty": {
    ar: "لا توجد ولاية بهذا الاسم",
    en: "No wilaya matches that name",
  },
  "delivery.defaultTag": { ar: "السعر الافتراضي", en: "Default price" },
  "delivery.editTitle": { ar: "تعديل سعر التوصيل", en: "Edit delivery price" },
  "delivery.editHint": {
    ar: "اكتب السعر بالدينار الجزائري، أو 0 لإرجاع الولاية إلى السعر الافتراضي.",
    en: "Type the price in Algerian dinars, or 0 to put the wilaya back on the default price.",
  },
  "delivery.pricePlaceholder": { ar: "مثال: 700", en: "e.g. 700" },
  "delivery.saved": { ar: "تم تحديث سعر التوصيل", en: "Delivery price updated" },
  "delivery.error": { ar: "تعذر حفظ السعر", en: "Could not save the price" },
  "delivery.editDefault": {
    ar: "تعديل السعر الافتراضي",
    en: "Edit the default price",
  },
  "delivery.editWilaya": {
    ar: "تعديل سعر {wilaya}",
    en: "Edit the price of {wilaya}",
  },
  "delivery.orderHint": {
    ar: "السعر النهائي للطلب = مجموع المنتجات + سعر التوصيل لولايتك.",
    en: "Order total = products + the delivery price of your wilaya.",
  },
  "footer.admin": { ar: "لوحة التحكم", en: "Admin panel" },

  /* ---- store phone ----------------------------------------------- */
  "phone.title": { ar: "رقم الهاتف", en: "Phone number" },
  "phone.placeholder": {
    ar: "اكتب رقم الهاتف الجديد (10 أرقام)",
    en: "Type the new phone number (10 digits)",
  },
  "phone.edit": { ar: "تغيير رقم الهاتف", en: "Change phone number" },
  "phone.hideNumber": { ar: "إخفاء الرقم", en: "Hide the number" },
  "phone.showNumber": { ar: "إظهار الرقم", en: "Show the number" },
  "notif.title": { ar: "الإشعارات", en: "Notifications" },
  "notif.lead": { ar: "أحدث الطلبات الواردة", en: "Latest incoming orders" },
  "notif.unread": { ar: "{n} جديد", en: "{n} new" },
  "notif.allRead": { ar: "لا جديد", en: "All read" },
  "notif.todayOrders": { ar: "طلبات اليوم", en: "Today's orders" },
  "notif.todaySales": { ar: "مبيعات اليوم", en: "Today's sales" },
  "notif.newOrder": { ar: "طلب جديد #{reference}", en: "New order #{reference}" },
  "notif.empty": {
    ar: "لا توجد طلبات بعد — أول طلب يصلك سيظهر هنا فوراً",
    en: "No orders yet — your first order shows up here instantly",
  },
  "notif.openOrders": {
    ar: "عرض كل الطلبات في اللوحة",
    en: "See all orders in the dashboard",
  },
  "phone.hint": {
    ar: "اكتب الرقم الجزائري بـ10 أرقام — سيُحدّث في كل الموقع (الهاتف، واتساب، التذييل).",
    en: "Enter the 10-digit Algerian number — it updates across the site (phone, WhatsApp, footer).",
  },
  "phone.invalid": {
    ar: "رقم الهاتف غير صحيح — أدخل 10 أرقام",
    en: "Invalid phone number — enter 10 digits",
  },
  "phone.saved": { ar: "تم تحديث رقم الهاتف", en: "Phone number updated" },

  /* ---- 404 ------------------------------------------------------- */
  "notFound.title": { ar: "الصفحة غير موجودة", en: "Page not found" },
  "notFound.body": {
    ar: "الرابط الذي طلبته غير متوفر. عد إلى المتجر واكتشف تشكيلة {store}.",
    en: "This link is not available. Head back to the shop and explore the {store} collection.",
  },
  "notFound.shop": { ar: "المتجر", en: "Shop" },
  "notFound.home": { ar: "الرئيسية", en: "Home" },

  /* ---- admin ----------------------------------------------------- */
  "admin.dashboard": { ar: "لوحة التحكم", en: "Dashboard" },
  "admin.signInTitle": { ar: "تسجيل الدخول", en: "Sign in" },
  "admin.username": { ar: "اسم المستخدم", en: "Username" },
  "admin.password": { ar: "كلمة المرور", en: "Password" },
  "admin.signIn": { ar: "دخول", en: "Sign in" },
  "admin.invalid": { ar: "بيانات الدخول غير صحيحة", en: "Wrong username or password" },
  "admin.backToStore": { ar: "رجوع إلى المتجر", en: "Back to the store" },
  "admin.viewStore": { ar: "عرض المتجر", en: "View store" },
  "admin.logout": { ar: "خروج", en: "Sign out" },
  "admin.tabProducts": { ar: "إدارة المنتجات", en: "Products" },
  "admin.tabCategories": { ar: "التصنيفات", en: "Categories" },
  "admin.tabSlider": { ar: "سلايدر التذييل", en: "Footer slider" },
  "admin.tabOrders": { ar: "الطلبات", en: "Orders" },
  "admin.categoriesLead": {
    ar: "إدارة التصنيفات — بطاقات الصفحة الرئيسية وصفحة المتجر",
    en: "Categories — the home-page cards and the shop filters",
  },
  "admin.newCategory": { ar: "تصنيف جديد", en: "New category" },
  "admin.editCategory": { ar: "تعديل تصنيف", en: "Edit category" },
  "admin.slug": { ar: "الاسم", en: "Name" },
  "admin.slugHint": {
    ar: "اكتبه بالحروف الإنكليزية بدون مسافات — مثال: shoes",
    en: "Write it in English letters without spaces — e.g. shoes",
  },
  "admin.categoryImage": { ar: "صورة التصنيف", en: "Category image" },
  "admin.editLogo": { ar: "تعديل الشعار", en: "Edit the logo" },
  "admin.logoImage": { ar: "صورة الشعار", en: "Logo image" },
  "admin.logoHint": {
    ar: "ارفع صورة شعار جديدة — تظهر في الشريط العلوي والتذييل وفي كل مكان في الموقع، وتُحدَّث معها أيقونة التبويب (الفافيكون) وشاشة التحميل تلقائياً.",
    en: "Upload a new logo — it appears in the header, the footer and everywhere on the site, and the browser tab icon (favicon) plus the loading screen follow automatically.",
  },
  "admin.logoReset": { ar: "الشعار الأصلي", en: "Default logo" },
  "admin.editInstagram": { ar: "تعديل رابط إنستغرام", en: "Edit the Instagram link" },
  "admin.editFacebook": { ar: "تعديل رابط فايسبوك", en: "Edit the Facebook link" },
  "admin.facebookUrl": { ar: "رابط الصفحة", en: "Page link" },
  "admin.facebookHint": {
    ar: "الرابط الكامل لصفحتك على فايسبوك — يُستعمل في الشريط العلوي وتذييل الموقع.",
    en: "The full link to your Facebook page — used in the top bar and the footer.",
  },
  "admin.editWhatsapp": { ar: "تعديل رقم واتساب", en: "Edit the WhatsApp number" },
  "admin.whatsappHint": {
    ar: "نفس رقم المتجر يُستعمل لفتح محادثة واتساب مباشرة مع الزبون.",
    en: "The same store number opens a direct WhatsApp chat with customers.",
  },
  "admin.instagramUrl": { ar: "رابط الحساب", en: "Profile link" },
  "admin.instagramHint": {
    ar: "الصق الرابط كاملاً (يبدأ بـ https://) — تفتحه أيقونة إنستغرام في الموقع.",
    en: "Paste the full link (starting with https://) — every Instagram icon opens it.",
  },
  "admin.invalidLink": {
    ar: "الرابط غير صحيح — يجب أن يبدأ بـ https://",
    en: "Invalid link — it must start with https://",
  },
  "admin.settingsSaved": { ar: "تم حفظ التعديلات", en: "Changes saved" },
  "admin.productCategoryRequired": {
    ar: "اختر التصنيف الذي تريد رفع المنتج فيه",
    en: "Choose the category to upload your product in",
  },
  "admin.noCategoriesForProduct": {
    ar: "لا توجد تصنيفات بعد — أنشئ تصنيفاً من تبويب «التصنيفات» أولاً.",
    en: "No categories yet — create one from the Categories tab first.",
  },
  "admin.categoryRequired": {
    ar: "أدخل المعرّف وارفع صورة التصنيف",
    en: "Enter the slug and upload a category image",
  },
  "admin.addCategory": { ar: "إضافة التصنيف", en: "Add category" },
  "admin.currentCategories": { ar: "التصنيفات الحالية ({n})", en: "Current categories ({n})" },
  "admin.colCategory": { ar: "التصنيف", en: "Category" },
  "admin.colImage": { ar: "الصورة", en: "Image" },
  "admin.noCategories": {
    ar: "لا توجد تصنيفات — أضف أول تصنيف من النموذج.",
    en: "No categories yet — add your first one from the form.",
  },
  "admin.categorySaved": { ar: "تم حفظ التصنيف", en: "Category saved" },
  "admin.deleteCategoryConfirm": {
    ar: "تأكيد حذف التصنيف؟ لن تُحذف منتجاته.",
    en: "Delete this category? Its products are kept.",
  },
  "admin.productsLead": {
    ar: "إدارة المنتجات — التعديلات تظهر فوراً في المتجر",
    en: "Products — every change shows up in the store instantly",
  },
  "admin.sliderLead": {
    ar: "سلايدر التذييل — صور تظهر تلقائياً أسفل كل صفحة",
    en: "Footer slider — images shown automatically at the bottom of every page",
  },
  "admin.ordersLead": { ar: "طلبات الزبائن الواردة", en: "Incoming customer orders" },
  "admin.filterAll": { ar: "الكل", en: "All" },
  "admin.searchOrders": { ar: "ابحث باسم الزبون أو الهاتف أو رقم الطلب…", en: "Search by name, phone or order number…" },
  "admin.changeStatus": { ar: "غيّر الحالة", en: "Change status" },
  "admin.markDelivered": {
    ar: "تم التعامل معه وتسليمه والدفع",
    en: "Handled, delivered and paid",
  },
  "admin.markPending": {
    ar: "إرجاع الطلب إلى قيد المعالجة",
    en: "Move back to processing",
  },
  "admin.adminNote": { ar: "ملاحظة داخلية", en: "Internal note" },
  "admin.adminNotePlaceholder": {
    ar: "اكتب ما حدث في المكالمة أو تفاصيل التوصيل",
    en: "Write the call outcome or the delivery details",
  },
  "admin.saveNote": { ar: "حفظ الملاحظة", en: "Save note" },
  "admin.noteSaved": { ar: "تم حفظ الملاحظة", en: "Note saved" },
  "admin.callCustomer": { ar: "اتصال", en: "Call" },
  "admin.whatsappCustomer": { ar: "واتساب", en: "WhatsApp" },
  "admin.orderItems": { ar: "{n} قطعة", en: "{n} items" },
  "admin.deleteOrderConfirm": {
    ar: "حذف هذا الطلب نهائياً؟",
    en: "Delete this order permanently?",
  },
  "admin.deliveredRevenue": { ar: "مبيعات مُسلَّمة", en: "Delivered revenue" },
  "admin.pendingCount": { ar: "طلبات قيد المعالجة", en: "Pending orders" },
  "admin.expand": { ar: "التفاصيل", en: "Details" },
  "admin.collapse": { ar: "إغلاق", en: "Close" },
  "admin.newProduct": { ar: "منتج جديد", en: "New product" },
  "admin.editProduct": { ar: "تعديل منتج", en: "Edit product" },
  "admin.cancel": { ar: "إلغاء", en: "Cancel" },
  "admin.confirmTitle": { ar: "هل أنت متأكد؟", en: "Are you sure?" },
  "admin.nameAr": { ar: "اسم المنتج", en: "Product name" },
  "admin.nameArPlaceholder": {
    ar: "اكتب اسم القطعة كما سيراه الزبون",
    en: "Write the piece name as the customer will see it",
  },
  "admin.slugPlaceholder": { ar: "oversized-tee", en: "oversized-tee" },
  "admin.usernamePlaceholder": { ar: "اسم المستخدم", en: "Username" },
  "admin.passwordPlaceholder": { ar: "••••••••", en: "••••••••" },
  "admin.currentPassword": { ar: "كلمة المرور الحالية", en: "Current password" },
  "admin.newPassword": { ar: "كلمة المرور الجديدة", en: "New password" },
  "admin.confirmPassword": {
    ar: "تأكيد كلمة المرور الجديدة",
    en: "Confirm new password",
  },
  "admin.pwEnterCurrent": {
    ar: "أدخل كلمة المرور الحالية",
    en: "Enter the current password",
  },
  "admin.pwEnterNew": { ar: "6 أحرف على الأقل", en: "At least 6 characters" },
  "admin.pwRepeatNew": {
    ar: "أعد كتابة كلمة المرور الجديدة",
    en: "Repeat the new password",
  },
  "admin.pwMismatch": {
    ar: "كلمتا المرور غير متطابقتين",
    en: "The two passwords do not match",
  },
  "admin.pwTooShort": {
    ar: "كلمة المرور قصيرة — استعمل 6 أحرف على الأقل",
    en: "Too short — use at least 6 characters",
  },
  "admin.pwSame": {
    ar: "اختر كلمة مرور مختلفة عن الحالية",
    en: "Pick a password different from the current one",
  },
  "admin.pwChanged": {
    ar: "تم تغيير كلمة المرور بنجاح",
    en: "Password changed successfully",
  },
  "admin.pwChangeFailed": {
    ar: "تعذر تغيير كلمة المرور",
    en: "Could not change the password",
  },
  "admin.pwChangeButton": {
    ar: "تغيير كلمة المرور والدخول",
    en: "Change password & sign in",
  },
  "admin.pwChangeIntro": {
    ar: "لأمان متجرك، اختر كلمة مرور خاصة بك قبل الدخول إلى لوحة التحكم.",
    en: "For your store's security, set your own password before opening the dashboard.",
  },
  "admin.changePassword": {
    ar: "تغيير كلمة المرور",
    en: "Change password",
  },
  "admin.pwChangeTitle": {
    ar: "غيّر كلمة مرور لوحة التحكم: أدخل اسم المستخدم وكلمة المرور الحالية ثم الجديدة مرتين.",
    en: "Change your dashboard password: enter the username, the current password, then the new one twice.",
  },
  "admin.pwNeedUsername": {
    ar: "أدخل اسم المستخدم أولاً",
    en: "Enter the username first",
  },
  "admin.backToLogin": {
    ar: "رجوع إلى تسجيل الدخول",
    en: "Back to sign in",
  },
  "admin.pwShow": { ar: "إظهار كلمة المرور", en: "Show password" },
  "admin.pwHide": { ar: "إخفاء كلمة المرور", en: "Hide password" },
  "admin.tryAgain": {
    ar: "حدث خطأ غير متوقع، أعد المحاولة",
    en: "Something went wrong — try again",
  },
  "admin.deliveryFee": {
    ar: "سعر التوصيل (دج)",
    en: "Delivery price (DA)",
  },
  "admin.deliveryFeeHint": {
    ar: "اتركه فارغاً لاستعمال السعر الافتراضي للمتجر.",
    en: "Leave empty to use the store's default delivery price.",
  },
  "admin.deliveryShort": { ar: "توصيل: {fee}", en: "Delivery: {fee}" },
  "admin.price": { ar: "السعر (دج)", en: "Price (DZD)" },
  "admin.oldPrice": { ar: "السعر قبل التخفيض (اختياري)", en: "Price before discount (optional)" },
  "admin.discountOn": { ar: "التخفيض مفعّل — يوفر الزبون {save}", en: "Discount on — customer saves {save}" },
  "admin.discountOff": {
    ar: "اتركه فارغاً لعرض السعر بدون تخفيض",
    en: "Leave empty to show the price without a discount",
  },
  "admin.category": {
    ar: "في أي تصنيف تريد رفع المنتج؟",
    en: "Which category do you want to upload the product in?",
  },
  "admin.images": { ar: "صور المنتج", en: "Product photos" },
  "admin.imagesHint": {
    ar: "ارفع الصور من جهازك مباشرة — يمكنك إضافة أكثر من صورة، واضغط × لحذف أي صورة.",
    en: "Upload the photos straight from your device — you can add several, and press × to remove one.",
  },
  "admin.imageAdded": { ar: "تمت إضافة الصورة", en: "Photo added" },
  "admin.availableSizes": {
    ar: "المقاسات التي تتوفر عليها هذه القطعة",
    en: "Sizes this piece comes in",
  },
  "admin.availableSizesHint": {
    ar: "اضغط على المقاس لتحديده أو إلغائه.",
    en: "Tap a size to pick it, tap again to remove it.",
  },
  "admin.sizesPicked": {
    ar: "{n} مقاس مختار",
    en: "{n} sizes picked",
  },
  "admin.sizesNone": {
    ar: "لم تختر أي مقاس بعد.",
    en: "No size picked yet.",
  },
  "admin.soldOutSizes": {
    ar: "مقاسات نفذت كميتها (اختياري)",
    en: "Sold-out sizes (optional)",
  },
  "admin.soldOutSizesHint": {
    ar: "اضغط على المقاس الذي نفذ من المخزون ليتعطّل عند الزبون.",
    en: "Tap a size that is out of stock so shoppers see it disabled.",
  },
  "admin.colorStock": {
    ar: "المخزون لكل لون (اختياري)",
    en: "Stock per colour (optional)",
  },
  "admin.colorStockHint": {
    ar: "اضغط على المقاس تحت اللون ليعطّله عند الزبون عندما يختار هذا اللون فقط.",
    en: "Tap a size under a colour to disable it when the shopper picks that colour.",
  },
  "admin.sizeLetters": { ar: "حروف", en: "Letters" },
  "admin.sizeNumbers": { ar: "أرقام", en: "Numbers" },
  "admin.sizeExtra": { ar: "مقاسات أخرى", en: "Other sizes" },
  "admin.colors": { ar: "الألوان", en: "Colours" },
  "admin.colorsHint": {
    ar: "مثال: black, white, navy",
    en: "e.g. black, white, navy",
  },
  "admin.singleColorHint": {
    ar: "لون واحد فقط للمنتج — وكل صورة ترفعها تحمل لوناً واحداً، وأزرار الألوان عند الزبون تأتي من الصور.",
    en: "One colour for the product — each photo you upload carries a single colour, and the shopper's colour buttons come from the photos.",
  },
  "admin.noColorNote": {
    ar: "لم تختر لوناً — سيظهر للزبون كـ «غير معروف»",
    en: "No colour picked — customers will see “Unknown”",
  },
  "product.unknownColor": { ar: "غير معروف", en: "Unknown" },
  "admin.featured": { ar: "منتج مميز", en: "Featured product" },
  "admin.soldOutFlag": { ar: "نفذت الكمية", en: "Sold out" },
  "admin.saveChanges": { ar: "حفظ التعديلات", en: "Save changes" },
  "admin.addProduct": { ar: "إضافة المنتج", en: "Add product" },
  "admin.currentProducts": { ar: "المنتجات الحالية ({n})", en: "Current products ({n})" },
  "admin.colProduct": { ar: "المنتج", en: "Product" },
  "admin.colPrice": { ar: "السعر", en: "Price" },
  "admin.colSizes": { ar: "المقاسات", en: "Sizes" },
  "admin.orderedSizes": {
    ar: "المطلوب من الزبائن: {sizes}",
    en: "Ordered by customers: {sizes}",
  },
  "admin.productSizes": {
    ar: "مقاسات المنتج: {sizes}",
    en: "Product sizes: {sizes}",
  },
  "admin.colStatus": { ar: "الحالة", en: "Status" },
  "admin.colActions": { ar: "إجراءات", en: "Actions" },
  "admin.available": { ar: "متوفر", en: "In stock" },
  "admin.edit": { ar: "تعديل", en: "Edit" },
  "admin.delete": { ar: "حذف", en: "Delete" },
  "admin.noProducts": {
    ar: "لا توجد منتجات — أضف أول منتج من النموذج.",
    en: "No products yet — add your first one from the form.",
  },
  "admin.nameRequired": {
    ar: "اسم المنتج مطلوب",
    en: "The product name is required",
  },
  "admin.priceRequired": { ar: "أدخل سعراً صحيحاً بالدينار", en: "Enter a valid price in dinars" },
  "admin.productUpdated": { ar: "تم تحديث المنتج", en: "Product updated" },
  "admin.productAdded": { ar: "تم إضافة المنتج", en: "Product added" },
  "admin.deleteProductConfirm": {
    ar: "تأكيد حذف المنتج؟",
    en: "Delete this product?",
  },
  "admin.deleted": { ar: "تم الحذف", en: "Deleted" },
  "admin.deleteFailed": { ar: "تعذر الحذف", en: "Could not delete" },
  "admin.saveFailed": { ar: "تعذر الحفظ", en: "Could not save" },
  "admin.newSlide": { ar: "صورة جديدة للسلايدر", en: "New slider image" },
  "admin.imageUrl": { ar: "صورة الشريحة", en: "Slide image" },
  "admin.imageUpload": { ar: "ارفع صورة من جهازك", en: "Upload an image from your device" },
  "admin.uploading": { ar: "جارٍ رفع الصورة…", en: "Uploading image…" },
  "admin.uploadFailed": { ar: "تعذر رفع الصورة", en: "Could not upload the image" },
  "admin.titleAr": { ar: "العنوان", en: "Title" },
  "admin.addSlide": { ar: "إضافة للسلايدر", en: "Add to the slider" },
  "admin.sliderHint": {
    ar: "الصور تظهر مباشرة في السلايدر المتحرك أسفل الموقع بترتيب الإضافة.",
    en: "Images appear right away in the moving slider at the bottom of the site, in the order you add them.",
  },
  "admin.slideTitlePlaceholder": {
    ar: "اكتب عنواناً قصيراً للصورة",
    en: "Write a short title for the photo",
  },
  "admin.imageRequired": { ar: "ارفع صورة الشريحة", en: "Upload a slide image" },
  "admin.slideAdded": { ar: "تمت إضافة الصورة", en: "Image added" },
  "admin.slideUpdated": { ar: "تم تحديث الشريحة", en: "Slide updated" },
  "admin.editSlide": { ar: "تعديل شريحة", en: "Edit slide" },
  "admin.slideHref": {
    ar: "رابط الشريحة عند الضغط عليها (اختياري)",
    en: "Slide link on click (optional)",
  },
  "admin.slideDeleteConfirm": { ar: "حذف هذه الصورة؟", en: "Delete this image?" },
  "admin.slideDeleted": { ar: "تم الحذف", en: "Deleted" },
  "admin.noSlides": {
    ar: "لا توجد صور حالياً — أضف أول صورة للسلايدر.",
    en: "No images yet — add your first slider image.",
  },
  "hero.noSlides": {
    ar: "قريباً — تشكيلة جديدة",
    en: "Coming soon — new collection",
  },
  "admin.orders": { ar: "الطلبات", en: "Orders" },
  "admin.revenue": { ar: "رقم الأعمال", en: "Revenue" },
  "admin.pieces": { ar: "القطع المطلوبة", en: "Items ordered" },
  "admin.noOrders": {
    ar: "لا توجد طلبات بعد — ستظهر هنا مباشرة بعد أول عملية شراء.",
    en: "No orders yet — they will appear here right after the first purchase.",
  },
  "admin.sizeShort": { ar: "المقاس {size}", en: "Size {size}" },

  /* ---- admin: site design ---------------------------------------- */
  "admin.tabDesign": { ar: "تصميم الموقع", en: "Site design" },
  "admin.designLead": {
    ar: "اختر تصميم موقعك — الألوان، لون الهيدر والفوتر، اللمسة المميزة واستدارة الحواف تتغيّر فوراً على كل صفحات الموقع، والمنتجات والعروض لا تتأثر.",
    en: "Pick your store design — colours, header and footer tone, the accent and the corner radius change instantly on every page. Products and orders are never touched.",
  },
  "admin.designCurrent": {
    ar: "التصميم المطبّق الآن",
    en: "Design applied now",
  },
  "admin.designHint": {
    ar: "اضغط أي تصميم ليُطبَّق فوراً على المتجر كله، ويظهر لك هنا مباشرة قبل أن يراه الزبائن. تصميمك القديم محفوظ دائماً باسم «الأصلي».",
    en: "Tap any design to apply it to the whole store right away — you see it here before shoppers do. Your previous look is always saved as “Original”.",
  },
  "admin.designApply": { ar: "تطبيق هذا التصميم", en: "Apply this design" },
  "admin.designApplied": { ar: "مطبّق حالياً", en: "Applied now" },
  "admin.designOriginalBadge": { ar: "الأصلي", en: "Original" },
  "admin.designDarkBadge": { ar: "داكن", en: "Dark" },
  "admin.designRestore": {
    ar: "استرجاع التصميم الأصلي",
    en: "Restore original design",
  },
  "admin.designSaved": {
    ar: "تم تطبيق التصميم على الموقع",
    en: "Design applied to your store",
  },
  "admin.designFailed": {
    ar: "تعذر تغيير التصميم، حاول مرة أخرى",
    en: "Could not change the design — please try again",
  },

  /* ---- admin: store identity ------------------------------------- */
  "admin.identity": { ar: "هوية المتجر", en: "Store identity" },
  "admin.identityLead": {
    ar: "الاسم، الوصف، النص التعريفي، الشعار وموقع المحل — تُحدَّث فوراً في الشريط العلوي والتذييل وعنوان التبويب وشاشة التحميل.",
    en: "Name, description, tagline, logo and shop location — updated instantly in the header, the footer, the tab title and the loading screen.",
  },
  "admin.identitySaved": { ar: "تم تحديث هوية المتجر", en: "Store identity updated" },
  "admin.identityReset": { ar: "استرجاع الأصلي", en: "Restore defaults" },
  "admin.editIdentity": {
    ar: "تعديل الشعار واسم المتجر",
    en: "Edit the logo & store name",
  },
  "admin.editBrandName": { ar: "تعديل اسم المتجر", en: "Edit the store name" },
  "admin.brandName": { ar: "اسم المتجر", en: "Store name" },
  "admin.tagline": { ar: "النص التعريفي", en: "Tagline" },
  "admin.brandNameHint": {
    ar: "يظهر في الشريط العلوي والتذييل، وفي عنوان تبويب المتصفح وشاشة التحميل.",
    en: "Shown in the header and the footer, plus the browser tab title and the loading screen.",
  },
  "admin.brandNameRequired": {
    ar: "اكتب اسم المتجر أولاً",
    en: "Enter the store name first",
  },
  "admin.taglineHint": {
    ar: "السطر الصغير تحت الاسم — مثال: Man's Fashion · Boutique Boys",
    en: "The small line under the name — e.g. Man's Fashion · Boutique Boys",
  },
  "admin.siteDescription": { ar: "وصف الموقع", en: "Site description" },
  "admin.siteDescriptionHint": {
    ar: "يظهر في نتائج Google و مشاركة الموقع. يجب أن يذكر التوصيل إلى 69 ولاية.",
    en: "Used in Google results and when sharing the site. Mention delivery to 69 wilayas.",
  },
  "admin.editMap": {
    ar: "تعديل موقع الخريطة",
    en: "Edit the map location",
  },
  "admin.mapUrl": {
    ar: "رابط الخريطة أو الإحداثيات",
    en: "Map link or coordinates",
  },
  "admin.mapCoordinates": { ar: "إحداثيات المتجر", en: "Shop coordinates" },
  "admin.mapInvalid": {
    ar: "تعذر قراءة هذا الرابط — الصق رابط خرائط جوجل أو الإحداثيات",
    en: "Could not read that link — paste a Google Maps link or coordinates",
  },

  /* ---- admin: image storage (Cloudflare R2) ---------------------- */
  "admin.r2Title": {
    ar: "تخزين الصور (Cloudflare R2)",
    en: "Image storage (Cloudflare R2)",
  },
  "admin.r2Hint": {
    ar: "اضغط الاختبار: تُرفع صورة صغيرة إلى R2 ثم تُقرأ من رابطها العام ثم تُحذف — للتأكد من أن المفاتيح تعمل.",
    en: "Press test: a tiny image is uploaded to R2, read back from its public URL, then deleted — to prove the keys work.",
  },
  "admin.r2Test": { ar: "اختبار اتصال R2", en: "Test R2 connection" },
  "admin.r2Testing": { ar: "جارٍ الاختبار…", en: "Testing…" },
  "admin.r2Ok": {
    ar: "R2 يعمل: تم الرفع والقراءة بنجاح",
    en: "R2 works: upload and read-back succeeded",
  },
  "admin.r2ConfigMissing": {
    ar: "R2 غير مُعدّ بعد — أضف المتغيّرات الناقصة في Keys / API keys",
    en: "R2 is not set up yet — add the missing variables in Keys / API keys",
  },
  "admin.r2Failed": {
    ar: "فشل الاتصال بـ R2 — راجع حالة PUT/GET أدناه",
    en: "R2 connection failed — check the PUT/GET status below",
  },
  "admin.r2Waiting": {
    ar: "لم يتم الاختبار بعد. إذا لم تُضبط المفاتيح، تُحفظ الصور مؤقتاً في تخزين Convex.",
    en: "Not tested yet. Without the keys, images still go to Convex storage.",
  },
  "admin.r2OkDetail": {
    ar: "الـ bucket: {bucket} — رفع {put}، قراءة {get} — تم حذف ملف الاختبار ({cleanup}).",
    en: "Bucket: {bucket} — upload {put}, read {get} — probe deleted ({cleanup}).",
  },
  "admin.r2FailDetail": {
    ar: "الرفع: {put} — القراءة العامة: {get} — رابط R2 العام يجب أن يكون مفتوحًا للقراءة على البكت.",
    en: "Upload: {put} — public read: {get} — the public R2 URL must allow reads on the bucket.",
  },
} as const;

export type TKey = keyof typeof STRINGS;

type Vars = Record<string, string | number>;

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

/**
 * The context object is kept on `globalThis` on purpose. A hot reload (or a
 * re-imported lazy chunk) can evaluate this module twice, and two copies would
 * create two different contexts: the provider would fill one while `useI18n`
 * reads the other, crashing the preview with "useI18n must be used inside
 * <LanguageProvider>". One shared identity removes that failure mode.
 */
type LanguageContextObject = ReturnType<
  typeof createContext<LanguageContextValue | null>
>;

const contextHolder = globalThis as typeof globalThis & {
  __hadripLanguageContext__?: LanguageContextObject;
};

const LanguageContext =
  contextHolder.__hadripLanguageContext__ ??
  (contextHolder.__hadripLanguageContext__ = createContext<LanguageContextValue | null>(
    null,
  ));

const STORAGE_KEY = "hadrip.lang.v1";

type LanguageContextValue = {
  /** Active language. */
  lang: Lang;
  isAr: boolean;
  dir: "rtl" | "ltr";
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  /** Translate a dictionary key, with optional {placeholder} values. */
  t: (key: TKey, vars?: Vars) => string;
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === "undefined") return "ar";
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "ar";
    } catch {
      return "ar";
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
    // The live store name replaces {store} again in StoreMeta, as soon as the
    // saved identity arrives from the database.
    document.title = interpolate(STRINGS["meta.title"][lang], {
      store: STORE.name,
    });
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* storage unavailable — language stays for this session only */
    }
  }, [lang]);

  const t = useCallback(
    (key: TKey, vars?: Vars) => interpolate(STRINGS[key][lang], vars),
    [lang],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      isAr: lang === "ar",
      dir: lang === "ar" ? "rtl" : "ltr",
      setLang,
      toggleLang: () => setLang((current) => (current === "ar" ? "en" : "ar")),
      t,
    }),
    [lang, t],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

/** Arabic defaults — only used if a render somehow escapes the provider. */
const FALLBACK_I18N: LanguageContextValue = {
  lang: "ar",
  isAr: true,
  dir: "rtl",
  setLang: () => {},
  toggleLang: () => {},
  t: (key, vars) => interpolate(STRINGS[key].ar, vars),
};

export function useI18n(): LanguageContextValue {
  const context = useContext(LanguageContext);
  // Never a hard crash: the page keeps rendering (in Arabic) instead of
  // turning the whole preview blank.
  return context ?? FALLBACK_I18N;
}

/** Picks the right field of a record that stores both languages. */
export function pickLang(ar: string, en: string, lang: Lang): string {
  const value = lang === "ar" ? ar : en;
  return (value || ar || en).trim();
}
