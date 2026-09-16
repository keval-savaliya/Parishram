import { MessageCircle } from "lucide-react";

// Business WhatsApp number for the Parishram Engineering sales team.
const WA_LINK =
  "https://wa.me/919979998408?text=" +
  encodeURIComponent("Hello Parishram Engineering, I need a quotation for pipe fittings / auto parts.");

export const WhatsAppCTA = () => (
  <a
    href={WA_LINK}
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-[72px] right-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-[#25D366] shadow-lg shadow-black/30 transition-transform duration-200 hover:scale-110 active:scale-95 md:bottom-6 md:right-6"
    data-testid="whatsapp-cta"
    aria-label="Chat on WhatsApp"
    title="Chat with our sales team (placeholder number)"
  >
    <MessageCircle className="h-6 w-6 text-white" />
  </a>
);
