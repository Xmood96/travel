export const translations = {
  en: {
    // Common
    welcome: "Welcome",
    loading: "Loading",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    confirm: "Confirm",
    yes: "Yes",
    no: "No",
    search: "Search",
    filter: "Filter",
    all: "All",
    email: "Email",
    password: "Password",
    login: "Login",
    logout: "Logout",

    // Navigation & Menu
    dashboard: "Dashboard",
    users: "Users",
    tickets: "Tickets",
    services: "Services",
    settings: "Settings",
    logs: "Logs",
    profile: "Profile",

    // Header
    welcomeMessage: "Welcome, {{name}}",
    agencyName: "Al-Ihsan Agency",

    // Login
    loginTitle: "Login",
    emailLabel: "Email",
    passwordLabel: "Password",
    loginButton: "Login",
    loggingIn: "Logging in...",
    loginSuccess: "Login successful!",

    // Tickets
    ticketHistory: "Ticket History",
    ticketNumber: "Ticket #{{number}}",
    ticketsTitle: "Tickets",
    newTicket: "New Ticket",
    ticketStatus: "Status",
    ticketAmount: "Amount",
    partialPayment: "Partial Payment",
    amountDue: "Amount Due",
    paidAmount: "Paid Amount",
    isPaid: "Paid",
    isUnpaid: "Unpaid",
    paid: "Paid",
    unpaid: "Unpaid",
    remaining: "Remaining",
    editTicket: "Edit Ticket",
    deleteTicket: "Delete Ticket",
    markAsPaid: "Mark as Paid",
    updateAsPaid: "Update as Paid",
    ticketClosed: "Ticket Closed - Cannot Edit",
    fullyPaid: "Fully Paid",
    saveChanges: "Save Changes",

    // Service Tickets
    serviceTickets: "Service Tickets",
    serviceTicketHistory: "Service Ticket History",
    serviceTicketNumber: "Service Ticket #{{number}}",

    // Filters and Sorting
    allTickets: "All Tickets",
    paidTickets: "Paid",
    unpaidTickets: "Unpaid",
    newest: "Newest First",
    oldest: "Oldest First",
    filterByUser: "Filter by User",
    filterByDate: "Filter by Date",

    // Pagination
    page: "Page",
    previousPage: "Previous",
    nextPage: "Next",

    // Users
    usersTitle: "Users",
    userName: "Name",
    userEmail: "Email",
    userRole: "Role",
    unknownUser: "Unknown User",

    // Currency
    currency: "Currency",
    amount: "Amount",

    // Validation Messages
    required: "This field is required",
    invalidEmail: "Please enter a valid email",
    passwordMinLength: "Password must be at least 6 characters",

    // Success Messages
    ticketUpdated: "Ticket updated as paid ✅",
    ticketUpdateSuccess: "Ticket updated successfully",
    changesSaved: "Changes saved",
    ticketDeleted: "Ticket deleted successfully",

    // Error Messages
    ticketLoadError: "Error loading tickets",
    ticketUpdateError: "Failed to update ticket",
    ticketDeleteError: "Failed to delete ticket",
    saveError: "Error saving changes",
    partialPaymentExceedsAmount: "Partial payment cannot exceed amount due",
    selectValidCurrency: "Please select a valid currency",
    cannotEditClosedTicket: "Cannot edit closed ticket",
    userNotSpecified: "User not specified",
    invalidRole: "No valid role found",

    // Warnings
    partialPaymentWarning: "Partial payment cannot exceed amount due",

    // Status
    active: "Active",
    inactive: "Inactive",
    pending: "Pending",
    completed: "Completed",
    closed: "Closed",

    // Actions
    create: "Create",
    update: "Update",
    view: "View",
    manage: "Manage",
    export: "Export",
    import: "Import",
    print: "Print",

    // Date and Time
    date: "Date",
    time: "Time",
    createdAt: "Created At",
    updatedAt: "Updated At",

    // Language Switcher
    language: "Language",
    english: "English",
    arabic: "العربية",
    switchLanguage: "Switch Language",
  },

  ar: {
    // Common
    welcome: "مرحباً",
    loading: "جاري التحميل",
    error: "خطأ",
    success: "نجح",
    cancel: "إلغاء",
    save: "حفظ",
    delete: "حذف",
    edit: "تعديل",
    close: "إغلاق",
    confirm: "تأكيد",
    yes: "نعم",
    no: "لا",
    search: "بحث",
    filter: "فلترة",
    all: "الكل",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",

    // Navigation & Menu
    dashboard: "لوحة التحكم",
    users: "المستخدمين",
    tickets: "التذاكر",
    services: "الخدمات",
    settings: "الإعدادات",
    logs: "السجل",
    profile: "المستخدم",

    // Header
    welcomeMessage: "مرحبا، {{name}}",
    agencyName: "وكالة الإحسان",

    // Login
    loginTitle: "تسجيل الدخول",
    emailLabel: "البريد الإلكتروني",
    passwordLabel: "كلمة المرور",
    loginButton: "دخول",
    loggingIn: "...جاري الدخول",
    loginSuccess: "تم تسجيل الدخول بنجاح!",

    // Tickets
    ticketHistory: "سجل التذاكر",
    ticketNumber: "تذكرة #{{number}}",
    ticketsTitle: "التذاكر",
    newTicket: "تذكرة جديدة",
    ticketStatus: "الحالة",
    ticketAmount: "المبلغ",
    partialPayment: "دفع جزئي",
    amountDue: "المستحق",
    paidAmount: "سعر القطع",
    isPaid: "مدفوع",
    isUnpaid: "غير مدفوع",
    paid: "المدفوعة",
    unpaid: "الغير مدفوعة",
    remaining: "متبقي",
    editTicket: "تعديل التذكرة",
    deleteTicket: "حذف التذكرة",
    markAsPaid: "تحديد كمدفوع",
    updateAsPaid: "تحديث كمدفوع",
    ticketClosed: "تذكرة مغلقة - لا يمكن التعديل",
    fullyPaid: "مدفوعة بالكامل",
    saveChanges: "حفظ التغييرات",

    // Service Tickets
    serviceTickets: "تذاكر الخدمات",
    serviceTicketHistory: "سجل تذاكر الخدمات",
    serviceTicketNumber: "تذكرة خدمة #{{number}}",

    // Filters and Sorting
    allTickets: "كل التذاكر",
    paidTickets: "المدفوعة",
    unpaidTickets: "الغير مدفوعة",
    newest: "الأحدث أولاً",
    oldest: "الأقدم أولاً",
    filterByUser: "فلترة حسب المستخدم",
    filterByDate: "فلترة حسب التاريخ",

    // Pagination
    page: "صفحة",
    previousPage: "السابق",
    nextPage: "التالي",

    // Users
    usersTitle: "المستخدمين",
    userName: "الاسم",
    userEmail: "البريد الإلكتروني",
    userRole: "الدور",
    unknownUser: "مستخدم غير معروف",

    // Currency
    currency: "العملة",
    amount: "المبلغ",

    // Validation Messages
    required: "هذا الحقل مطلوب",
    invalidEmail: "يرجى إدخال بريد إلكتروني صحيح",
    passwordMinLength: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",

    // Success Messages
    ticketUpdated: "تم تحديث التذكرة كمدفوعة ✅",
    ticketUpdateSuccess: "تم تحديث التذكرة بنجاح",
    changesSaved: "تم حفظ التغييرات",
    ticketDeleted: "تم حذف التذكرة بنجاح",

    // Error Messages
    ticketLoadError: "حدث خطأ أثناء تحميل التذاكر",
    ticketUpdateError: "فشل في تحديث التذكرة",
    ticketDeleteError: "فشل في حذف التذكرة",
    saveError: "حدث خطأ أثناء حفظ التعديلات",
    partialPaymentExceedsAmount:
      "الدفع الجزئي لا يمكن أن يتجاوز المبلغ المستحق",
    selectValidCurrency: "يرجى اختيار عملة صحيحة",
    cannotEditClosedTicket: "لا يمكن تعديل تذكرة مغلقة",
    userNotSpecified: "لم يتم تحديد المستخدم",
    invalidRole: "لا يوجد دور صالح",

    // Warnings
    partialPaymentWarning: "الدفع الجزئي لا يمكن أن يتجاوز المبلغ المستحق",

    // Status
    active: "نشط",
    inactive: "غير نشط",
    pending: "معلق",
    completed: "مكتمل",
    closed: "مغلق",

    // Actions
    create: "إنشاء",
    update: "تحديث",
    view: "عرض",
    manage: "إدارة",
    export: "تصدير",
    import: "استيراد",
    print: "طباعة",

    // Date and Time
    date: "التاريخ",
    time: "الوقت",
    createdAt: "ت��ريخ الإنشاء",
    updatedAt: "تاريخ التحديث",

    // Language Switcher
    language: "اللغة",
    english: "English",
    arabic: "العربية",
    switchLanguage: "تغيير اللغة",
  },
};
