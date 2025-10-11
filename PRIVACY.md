# Privacy Policy & Data Protection

## 🔒 PII (Personally Identifiable Information)

### Data Classified as PII

The following data is considered PII and requires special handling:

#### Person Data:
- ✅ Full name (`name`, `lastName`)
- ✅ Phone numbers (`phones`)
- ✅ Physical addresses (`addresses` subcollection)
- ✅ Email addresses (if present)

#### Non-PII Data:
- ❌ Person type (CLIENT, PROVIDER)
- ❌ Person ID (anonymized identifier)
- ❌ Purchase statistics (aggregated)

---

## 📋 Audit Logging

### When Access is Logged

All access to PII is automatically logged to the `audit_logs` collection in Firestore.

### Logged Information:
```typescript
{
  timestamp: "2025-10-11T...",
  action: "READ_PERSON_PII",
  resourceType: "person",
  resourceId: "person123",
  accessedFields: ["name", "lastName", "phones", "addresses"],
  requester: "mcp-client",
  purpose: "Order fulfillment",
  success: true
}
```

### Tools with PII Access:

| Tool | PII Access | Audit Logged | Purpose Required |
|------|-----------|--------------|------------------|
| `get_person_details` | ✅ Yes | ✅ Yes | ✅ Yes |
| `get_client_orders` | ❌ No | ❌ No | ❌ No |
| `get_movement` | ⚠️ Name only | ❌ No | ❌ No |

---

## 🌍 Compliance

### GDPR (European Union)
- ✅ Right to access: Users can request their data
- ✅ Right to erasure: Data can be deleted
- ✅ Purpose limitation: Access purpose is required and logged
- ✅ Audit trail: All PII access is logged with timestamp

### Ley 25.326 (Argentina)
- ✅ Consentimiento: Access requires explicit purpose
- ✅ Finalidad: Purpose is logged for each access
- ✅ Seguridad: Audit logs ensure accountability
- ✅ Acceso: Users can request audit logs of their data

---

## 🔐 Security Measures

### API Authentication
- All requests require `Authorization: Bearer` header
- API key validated via `MCP_API_KEY` environment variable

### PII Access Control
- Only `get_person_details` tool provides full PII
- Requires `purpose` parameter for access justification
- All access logged to immutable `audit_logs` collection

### Data Minimization
- Resources (`persons#index`, `clients#recent`) expose minimal data
- No PII in cached resources
- Full details only via explicit tool calls

---

## 📊 Resources & PII

### Resources (No PII):
```
✅ mcp://estacion-dulce/persons#index
   - Only: id, displayName, type
   - No phones, addresses, or sensitive data

✅ mcp://estacion-dulce/clients#recent
   - Only: id, displayName, type, purchase stats
   - No contact information
```

### Tools (With PII):
```
⚠️ get_person_details
   - Requires: personId, purpose
   - Returns: Full person data + addresses
   - Logged: Yes, to audit_logs
```

---

## 🛡️ Data Retention

### Audit Logs:
- **Retention:** Indefinite (compliance requirement)
- **Location:** Firestore `audit_logs` collection
- **Access:** Restricted to administrators

### PII Data:
- **Retention:** Until user requests deletion
- **Deletion:** Manual via Firebase Console or admin tool
- **Backup:** Follow organization's backup policy

---

## 📞 Data Subject Rights

### To Request:
1. **Access to your data:** Contact administrator with your person ID
2. **Deletion of your data:** Submit erasure request
3. **Audit log of access:** Request logs from `audit_logs` collection
4. **Correction of data:** Contact administrator with corrections

### Administrator Contact:
- Review audit logs in Firebase Console
- Filter by `resourceId` to see all access to specific person
- Export logs for compliance reporting

---

## 🔄 Updates

This privacy policy may be updated to reflect changes in:
- Regulatory requirements (GDPR, Ley 25.326)
- System functionality
- Security measures

**Last Updated:** 2025-10-11

