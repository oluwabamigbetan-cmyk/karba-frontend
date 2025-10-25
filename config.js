// config.js
export const SITE = {
  brand: {
    name: "KARBA",
    tagline: "Financial Consultant",
    email: "info@karbafinancialconsultant.com",
    phoneIntlWhatsApp: "https://wa.me/2349162631205", // WhatsApp click
    mailto: "mailto:info@karbafinancialconsultant.com?subject=KARBA%20Enquiry",
  },

  nav: [
    { label: "Home", href: "#top" },
    { label: "Plans", href: "#services" },
    { label: "Real Estate", href: "#services" },
    { label: "About", href: "#about" },
  ],

  // Hero “stats” cards on the right
  heroStats: [
    { label: "Life Insurance", value: "" }, // label only card
    { label: "Clients", value: "100+" },
    { label: "Partners", value: "6+" },
    { 
      label: "Support",
      value: "WhatsApp • Email",
      links: [
        { text: "WhatsApp", href: "https://wa.me/2349162631205" },
        { text: "Email", href: "mailto:info@karbafinancialconsultant.com?subject=KARBA%20Enquiry" }
      ]
    },
  ],

  // Footer socials (edit any time)
  socials: [
    { name: "WhatsApp", href: "https://wa.me/2349162631205" },
    { name: "LinkedIn", href: "https://www.linkedin.com/in/babatunde-bamidegbetan-a48b646142/" },
    { name: "Facebook", href: "https://www.facebook.com/profile.php?id=61579031302878" },
    { name: "Instagram", href: "https://www.instagram.com/karba_fc?igsh=czdoamNnNVZ2p1" },
    { name: "YouTube", href: "https://youtube.com/@KarbaFinancialConsultant" },
    { name: "Email", href: "mailto:info@karbafinancialconsultant.com?subject=KARBA%20Enquiry" },
    // { name: "TikTok", href: "" }, // add later
  ],

  portal: {
    buttonLabel: "Portal Login",
    modalTitle: "Portal is in progress",
    modalBody: "Client/Agent Portal is currently in development. Need help now?",
    actions: [
      { label: "WhatsApp", href: "https://wa.me/2349162631205", kind: "primary" },
      { label: "Email", href: "mailto:info@karbafinancialconsultant.com?subject=KARBA%20Enquiry", kind: "ghost" },
    ],
  },
};
