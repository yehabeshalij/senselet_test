// // // import React, { useState } from 'react';
// // // import { parseVcfData } from '../parseVcf';

// // // interface Props {
// // //   vcfRawData: string;
// // //   onClose: () => void;
// // //   onSelectContact: (phone: string) => void;
// // // }

// // // const ContactDirectoryModal: React.FC<Props> = ({ vcfRawData, onClose, onSelectContact }) => {
// // //   const [searchTerm, setSearchTerm] = useState('');

// // //   // ዳታውን ፓርስ እናደርጋለን
// // //   const contacts = parseVcfData(vcfRawData);

// // //   // በፍለጋው መሰረት ማጣራት
// // //   const filteredContacts = contacts.filter(
// // //     (c) =>
// // //       c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // //       c.phone.includes(searchTerm)
// // //   );

// // //   return (
// // //     <div
// // //       style={{
// // //         position: 'fixed',
// // //         top: 0,
// // //         left: 0,
// // //         right: 0,
// // //         bottom: 0,
// // //         backgroundColor: 'rgba(0,0,0,0.5)',
// // //         display: 'flex',
// // //         alignItems: 'center',
// // //         justifyContent: 'center',
// // //         zIndex: 1000,
// // //       }}
// // //     >
// // //       <div
// // //         style={{
// // //           backgroundColor: '#fff',
// // //           width: '90%',
// // //           maxWidth: '400px',
// // //           borderRadius: '8px',
// // //           padding: '15px',
// // //           maxHeight: '80vh',
// // //           display: 'flex',
// // //           flexDirection: 'column',
// // //           boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
// // //         }}
// // //       >
// // //         {/* Header */}
// // //         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
// // //           <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>የደንበኞች ስልክ ማውጫ</h3>
// // //           <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer' }}>
// // //             ✕
// // //           </button>
// // //         </div>

// // //         {/* Search Bar */}
// // //         <input
// // //           type="text"
// // //           placeholder="ስም ወይም ስልክ ፈልግ..."
// // //           value={searchTerm}
// // //           onChange={(e) => setSearchTerm(e.target.value)}
// // //           style={{
// // //             padding: '8px 10px',
// // //             border: '1px solid #cbd5e1',
// // //             borderRadius: '4px',
// // //             marginBottom: '10px',
// // //             fontSize: '14px',
// // //           }}
// // //         />

// // //         {/* Contact List */}
// // //         <div style={{ overflowY: 'auto', flex: 1 }}>
// // //           {filteredContacts.length === 0 ? (
// // //             <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', marginTop: '20px' }}>
// // //               ምንም ስልክ አልተገኘም
// // //             </p>
// // //           ) : (
// // //             filteredContacts.map((contact, index) => (
// // //               <div
// // //                 key={index}
// // //                 onClick={() => {
// // //                   onSelectContact(contact.phone);
// // //                   onClose();
// // //                 }}
// // //                 style={{
// // //                   padding: '10px',
// // //                   borderBottom: '1px solid #f1f5f9',
// // //                   cursor: 'pointer',
// // //                   display: 'flex',
// // //                   justifyContent: 'space-between',
// // //                   alignItems: 'center',
// // //                 }}
// // //               >
// // //                 <span style={{ fontWeight: '500', color: '#334155', fontSize: '14px' }}>{contact.name}</span>
// // //                 <span style={{ color: '#0284c7', fontSize: '13px', fontWeight: 'bold' }}>{contact.phone}</span>
// // //               </div>
// // //             ))
// // //           )}
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default ContactDirectoryModal;

// // import React, { useState, useEffect } from 'react';

// // // የኮንታክት ዳታ ቅርፅ (Type)
// // interface Contact {
// //   name?: string;
// //   phone?: string;
// //   FN?: string;
// //   TEL?: string;
// //   fn?: string;
// //   tel?: string;
// // }

// // interface Props {
// //   vcfRawData?: string; // ከዚህ በፊት የነበረውን ፕሮፕ እንዳይበላሽ ኦፕሽናል አድርገነዋል
// //   onClose: () => void;
// //   onSelectContact: (contact: { name: string; phone: string }) => void;
// // }

// // const ContactDirectoryModal: React.FC<Props> = ({ onClose, onSelectContact }) => {
// //   const [searchTerm, setSearchTerm] = useState('');
// //   const [contacts, setContacts] = useState<Contact[]>([]);
// //   const [loading, setLoading] = useState(true);

// //   // 1. public/contacts.json ፋይሉን በቅጽበት መጫን
// //   useEffect(() => {
// //     fetch('/contacts.json')
// //       .then((res) => res.json())
// //       .then((data: Contact[]) => {
// //         setContacts(data);
// //         setLoading(false);
// //       })
// //       .catch((err) => {
// //         console.error('JSON ፋይሉን ማንበብ አልተቻለም:', err);
// //         setLoading(false);
// //       });
// //   }, []);

// //   // 2. በፍለጋው (Search) መሰረት ማጣራት
// //   const filteredContacts = contacts.filter((c) => {
// //     const contactName = (c.name || c.FN || c.fn || '').toLowerCase();
// //     const contactPhone = (c.phone || c.TEL || c.tel || '').toString();
// //     const query = searchTerm.toLowerCase();

// //     return contactName.includes(query) || contactPhone.includes(query);
// //   });

// //   return (
// //     <div
// //       style={{
// //         position: 'fixed',
// //         top: 0,
// //         left: 0,
// //         right: 0,
// //         bottom: 0,
// //         backgroundColor: 'rgba(0,0,0,0.5)',
// //         display: 'flex',
// //         alignItems: 'center',
// //         justifyContent: 'center',
// //         zIndex: 1000,
// //       }}
// //     >
// //       <div
// //         style={{
// //           backgroundColor: '#fff',
// //           width: '90%',
// //           maxWidth: '400px',
// //           borderRadius: '8px',
// //           padding: '15px',
// //           maxHeight: '80vh',
// //           display: 'flex',
// //           flexDirection: 'column',
// //           boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
// //         }}
// //       >
// //         {/* Header */}
// //         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
// //           <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>የደንበኞች ስልክ ማውጫ</h3>
// //           <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer' }}>
// //             ✕
// //           </button>
// //         </div>

// //         {/* Search Bar */}
// //         <input
// //           type="text"
// //           placeholder="ስም ወይም ስልክ ፈልግ..."
// //           value={searchTerm}
// //           onChange={(e) => setSearchTerm(e.target.value)}
// //           autoFocus
// //           style={{
// //             padding: '8px 10px',
// //             border: '1px solid #cbd5e1',
// //             borderRadius: '4px',
// //             marginBottom: '10px',
// //             fontSize: '14px',
// //           }}
// //         />

// //         {/* Contact List */}
// //         <div style={{ overflowY: 'auto', flex: 1 }}>
// //           {loading ? (
// //             <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', marginTop: '20px' }}>
// //               ስልኮች እየጫኑ ነው...
// //             </p>
// //           ) : filteredContacts.length === 0 ? (
// //             <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', marginTop: '20px' }}>
// //               ምንም ስልክ አልተገኘም
// //             </p>
// //           ) : (
// //             // ለአፈፃፀም ፍጥነት የመጀመሪያዎቹን 80 ብቻ ያሳያል
// //             filteredContacts.slice(0, 80).map((contact, index) => {
// //               const name = contact.name || contact.FN || contact.fn || 'ያልተገለጸ ስም';
// //               const phone = contact.phone || contact.TEL || contact.tel || '';

// //               return (
// //                 <div
// //                   key={index}
// //                   onClick={() => {
// //                     // ለ Parent Component ስም እና ስልኩን በ Object መልክ ይልካል
// //                     onSelectContact({ name, phone });
// //                     onClose();
// //                   }}
// //                   style={{
// //                     padding: '10px',
// //                     borderBottom: '1px solid #f1f5f9',
// //                     cursor: 'pointer',
// //                     display: 'flex',
// //                     justifyContent: 'space-between',
// //                     alignItems: 'center',
// //                   }}
// //                 >
// //                   <span style={{ fontWeight: '500', color: '#334155', fontSize: '14px' }}>{name}</span>
// //                   <span style={{ color: '#0284c7', fontSize: '13px', fontWeight: 'bold' }}>{phone}</span>
// //                 </div>
// //               );
// //             })
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default ContactDirectoryModal;

// import React, { useState, useEffect } from 'react';

// interface Props {
//   vcfRawData?: string;
//   onClose: () => void;
//   onSelectContact: (contact: { name: string; phone: string }) => void;
// }

// const ContactDirectoryModal: React.FC<Props> = ({ onClose, onSelectContact }) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [contacts, setContacts] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   // 1. public/contacts.json ፋይሉን መጫን
//   useEffect(() => {
//     fetch('/contacts.json')
//       .then((res) => res.json())
//       .then((data) => {
//         setContacts(data);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error('JSON ፋይሉን ማንበብ አልተቻለም:', err);
//         setLoading(false);
//       });
//   }, []);

//   // ከ JSON ፋይልህ ላይ ስሙን የሚያወጣ Helper Function
//   const getContactName = (c: any) => {
//     const fullName = [c["First Name"], c["Last Name"]].filter(Boolean).join(' '); //
//     return c["Display Name"] || fullName || c.name || c.FN || 'ያልተገለጸ ስም'; //[cite: 1]
//   };

//   // ከ JSON ፋይልህ ላይ ስልኩን የሚያወጣ Helper Function[cite: 1]
//   const getContactPhone = (c: any) => {
//     const phone = c["Mobile Phone"] || c["Home Phone"] || c["Business Phone"] || c.phone || c.TEL || ''; //[cite: 1]
//     return phone.toString();
//   };

//   // 2. በፍለጋው (Search) መሰረት ማጣራት
//   const filteredContacts = contacts.filter((c) => {
//     const name = getContactName(c).toLowerCase();
//     const phone = getContactPhone(c);
//     const query = searchTerm.toLowerCase();

//     return name.includes(query) || phone.includes(query);
//   });

//   return (
//     <div
//       style={{
//         position: 'fixed',
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//         backgroundColor: 'rgba(0,0,0,0.5)',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         zIndex: 1000,
//       }}
//     >
//       <div
//         style={{
//           backgroundColor: '#fff',
//           width: '90%',
//           maxWidth: '400px',
//           borderRadius: '8px',
//           padding: '15px',
//           maxHeight: '80vh',
//           display: 'flex',
//           flexDirection: 'column',
//           boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
//         }}
//       >
//         {/* Header */}
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
//           <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>የደንበኞች ስልክ ማውጫ</h3>
//           <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer' }}>
//             ✕
//           </button>
//         </div>

//         {/* Search Bar */}
//         <input
//           type="text"
//           placeholder="ስም ወይም ስልክ ፈልግ..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           autoFocus
//           style={{
//             padding: '8px 10px',
//             border: '1px solid #cbd5e1',
//             borderRadius: '4px',
//             marginBottom: '10px',
//             fontSize: '14px',
//           }}
//         />

//         {/* Contact List */}
//         <div style={{ overflowY: 'auto', flex: 1 }}>
//           {loading ? (
//             <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', marginTop: '20px' }}>
//               ስልኮች እየጫኑ ነው...
//             </p>
//           ) : filteredContacts.length === 0 ? (
//             <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', marginTop: '20px' }}>
//               ምንም ስልክ አልተገኘም
//             </p>
//           ) : (
//             filteredContacts.slice(0, 80).map((contact, index) => {
//               const name = getContactName(contact);
//               const phone = getContactPhone(contact);

//               return (
//                 <div
//                   key={index}
//                   onClick={() => {
//                     onSelectContact({ name, phone });
//                     onClose();
//                   }}
//                   style={{
//                     padding: '10px',
//                     borderBottom: '1px solid #f1f5f9',
//                     cursor: 'pointer',
//                     display: 'flex',
//                     justifyContent: 'space-between',
//                     alignItems: 'center',
//                   }}
//                 >
//                   <span style={{ fontWeight: '500', color: '#334155', fontSize: '14px' }}>{name}</span>
//                   <span style={{ color: '#0284c7', fontSize: '13px', fontWeight: 'bold' }}>{phone}</span>
//                 </div>
//               );
//             })
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ContactDirectoryModal;

import React, { useState, useEffect } from 'react';
import { CONTACTS_API_URL, apiFetch } from '../config/api';

interface Props {
  vcfRawData?: string;
  onClose: () => void;
  onSelectContact: (contact: { name: string; phone: string }) => void;
}

const ContactDirectoryModal: React.FC<Props> = ({ onClose, onSelectContact }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. public/contacts.json ፋይሉን መጫን
  useEffect(() => {
  apiFetch(CONTACTS_API_URL)
      .then((res) => res.json())
      .then((data) => {
        setContacts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('JSON ፋይሉን ማንበብ አልተቻለም:', err);
        setLoading(false);
      });
  }, []);

  // ከ JSON ፋይልህ ላይ ስሙን የሚያወጣ Helper Function
  const getContactName = (c: any) => {
    const fullName = [c["First Name"], c["Last Name"]].filter(Boolean).join(' ');
    return c["Display Name"] || fullName || c.name || c.FN || 'ያልተገለጸ ስም';
  };

  // ከ JSON ፋይልህ ላይ ስልኩን የሚያወጣ Helper Function
  const getContactPhone = (c: any) => {
    const phone = c["Mobile Phone"] || c["Home Phone"] || c["Business Phone"] || c.phone || c.TEL || '';
    return phone.toString();
  };

  // 2. በፍለጋው (Search) መሰረት ማጣራት
  const filteredContacts = contacts.filter((c) => {
    const name = getContactName(c).toLowerCase();
    const phone = getContactPhone(c);
    const query = searchTerm.toLowerCase();

    return name.includes(query) || phone.includes(query);
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          width: '90%',
          maxWidth: '400px',
          borderRadius: '8px',
          padding: '15px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>የደንበኞች ስልክ ማውጫ</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="ስም ወይም ስልክ ፈልግ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
          style={{
            padding: '8px 10px',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            marginBottom: '10px',
            fontSize: '14px',
          }}
        />

        {/* Contact List */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', marginTop: '20px' }}>
              ስልኮች እየጫኑ ነው...
            </p>
          ) : filteredContacts.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', marginTop: '20px' }}>
              ምንም ስልክ አልተገኘም
            </p>
          ) : (
            // እዚህ ጋር .slice(0, 80) ተነስቷል! አሁን 1592ቱንም በሙሉ ያሳያል
            filteredContacts.map((contact, index) => {
              const name = getContactName(contact);
              const phone = getContactPhone(contact);

              return (
                <div
                  key={index}
                  onClick={() => {
                    onSelectContact({ name, phone });
                    onClose();
                  }}
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: '500', color: '#334155', fontSize: '14px' }}>{name}</span>
                  <span style={{ color: '#0284c7', fontSize: '13px', fontWeight: 'bold' }}>{phone}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactDirectoryModal;