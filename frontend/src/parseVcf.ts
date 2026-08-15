export interface Contact {
  name: string;
  phone: string;
}

export const parseVcfData = (vcfText: string): Contact[] => {
  const vcards = vcfText.split(/END:VCARD/i);
  const contacts: Contact[] = [];

  vcards.forEach((vcard) => {
    if (!vcard.trim()) return;

    // ስም ማውጣት
    const fnMatch = vcard.match(/FN(?:;[^:]*)?:([^\r\n]+)/i);
    let name = fnMatch ? fnMatch[1].trim() : '';

    // የአማርኛ Quoted-Printable ጽሁፍ ከሆነ ማስተካከል
    if (name.includes('=')) {
      try {
        name = decodeURIComponent(name.replace(/=/g, '%'));
      } catch {
        // ታሊቅ ሳንካ እንዳይፈጠር
      }
    }

    // ስልክ ማውጣት
    const telMatches = [...vcard.matchAll(/TEL(?:;[^:]*)?:([^\r\n]+)/gi)];
    const phones = telMatches.map((m) => m[1].replace(/[^\d+]/g, '')).filter(Boolean);

    const primaryPhone = phones[0] || '';

    if (name && primaryPhone) {
      contacts.push({ name, phone: primaryPhone });
    }
  });

  return contacts;
};



