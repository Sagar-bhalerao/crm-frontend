/**
 * Data shapes shared by the UI, mock services and (later) the Express API.
 * JSDoc only — gives editor autocomplete without a TypeScript build step.
 * Field names are chosen to map 1:1 to PostgreSQL columns / JSON responses.
 *
 * @typedef {Object} Brand
 * @property {string} id
 * @property {string} name
 * @property {string} code          Short code used in lead IDs, e.g. "DNB"
 * @property {boolean} active
 * @property {string} [supportPhone]
 * @property {string} [supportEmail]
 *
 * @typedef {Object} Outlet
 * @property {string} id
 * @property {string} brandId
 * @property {string} name
 * @property {string} code          e.g. "MUM"
 * @property {string} city
 * @property {string} address
 * @property {string} phone
 * @property {boolean} active
 *
 * @typedef {Object} Mailbox
 * @property {string} address
 * @property {"google"|"microsoft"|"imap"} provider
 * @property {boolean} connected
 * @property {string|null} lastSyncedAt
 *
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {string} roleId
 * @property {string[]} brandIds    ["*"] = all brands
 * @property {string[]} outletIds   ["*"] = all outlets of their brands
 * @property {boolean} active
 * @property {Mailbox} [mailbox]
 *
 * @typedef {User & { role: {id:string,label:string}, permissions: string[] }} SessionUser
 *
 * @typedef {Object} Role
 * @property {string} id
 * @property {string} label
 * @property {string} description
 * @property {string[]} permissions  ["*"] = everything
 *
 * @typedef {Object} FollowUp
 * @property {string} id
 * @property {string} channel       see FOLLOW_UP_CHANNELS
 * @property {string} outcome
 * @property {string} note
 * @property {string} at
 * @property {string} byId
 * @property {string|null} nextFollowUpAt
 *
 * @typedef {Object} LineItem
 * @property {string} description
 * @property {number} qty
 * @property {number} rate
 *
 * @typedef {Object} Quotation
 * @property {string} number
 * @property {number} version
 * @property {LineItem[]} items
 * @property {number} discount       flat amount
 * @property {number} taxRate        percent
 * @property {string} validUntil
 * @property {string} notes
 * @property {"draft"|"shared"} status
 * @property {string} updatedAt
 * @property {string|null} sharedAt
 *
 * @typedef {Object} ProformaInvoice
 * @property {string} number
 * @property {LineItem[]} items
 * @property {number} discount
 * @property {number} taxRate
 * @property {number} advancePercent
 * @property {string} dueDate
 * @property {string} billingName
 * @property {string} billingGstin
 * @property {string} terms
 * @property {string} generatedAt
 * @property {string|null} sharedAt
 *
 * @typedef {Object} NotificationStatus
 * @property {"pending"|"sending"|"delivered"|"failed"} status
 * @property {string} to
 * @property {string|null} at
 *
 * @typedef {Object} Booking
 * @property {string} confirmationNumber
 * @property {number} totalAmount
 * @property {number} advancePaid
 * @property {string} paymentReference
 * @property {string} finalizedAt
 * @property {string} finalizedById
 * @property {{whatsapp: NotificationStatus, email: NotificationStatus}} notifications
 *
 * @typedef {Object} Activity
 * @property {string} id
 * @property {string} type          see ACTIVITY_TYPES in components/leads/LeadTimeline
 * @property {string} message
 * @property {string} at
 * @property {string|null} byId     null = system
 *
 * @typedef {Object} Email
 * @property {string} id
 * @property {"in"|"out"} direction
 * @property {string} from
 * @property {string} to
 * @property {string} subject
 * @property {string} body
 * @property {string} at
 *
 * @typedef {Object} Lead
 * @property {string} id            e.g. "DNB-MUM-10042"
 * @property {string} brandId
 * @property {string} outletId
 * @property {string} type          see LEAD_TYPES
 * @property {string} source        see LEAD_SOURCES
 * @property {string} status        see LEAD_STATUSES
 * @property {{name:string, mobile:string, email:string}} customer
 * @property {{name:string, gstin:string, contactPerson:string, designation:string}|null} company
 * @property {{date:string, timeSlot:string, guests:number, kids:number, celebrantName:string, celebrantAge:number|null, requirements:string[], remarks:string}} event
 * @property {string|null} assignedToId
 * @property {string|null} notInterestedReason
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string|null} lastFollowUpAt
 * @property {string|null} nextFollowUpAt
 * @property {FollowUp[]} followUps
 * @property {Quotation|null} quotation
 * @property {ProformaInvoice|null} invoice
 * @property {Booking|null} booking
 * @property {Activity[]} activities
 * @property {Email[]} emails
 *
 * Expanded view model returned by services (like an API JOIN):
 * @typedef {Lead & { brand: Brand, outlet: Outlet, assignee: User|null }} LeadView
 */

export {};
