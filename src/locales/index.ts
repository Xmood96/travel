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

    // Profile
    logoutSuccess: "🚪 Logged out successfully",
    logoutError: "❌ Error during logout",
    imageUploadSuccess: "Image uploaded successfully",
    imageUploadError: "Image upload failed",
    updateSuccess: "Updated successfully",
    updateError: "Update failed",
    name: "Name",
    preferredCurrency: "Preferred Currency",
    selectPreferredCurrency: "Select preferred currency",
    currencyDescription:
      "All amounts in the app will be displayed in this currency",
    saveChanges: "Save Changes",

    // Agent - Add Ticket/Service
    loadingAgentsMessage: "Loading agent data, please wait...",
    loginRequired: "Please login first",
    failedToLoadAgents: "Failed to load agent data. Please try again.",
    noAgentsAvailable: "No agent data available. Please add agents first.",
    ticketNumberRequired: "Please enter ticket/service number",
    selectSellerRequired: "Please select seller",
    selectUserRequired: "Please select user who issued the ticket",
    enterRequiredAmounts: "Please enter required amounts",
    selectServiceRequired: "Please select service",
    failedToLoadServices: "Failed to load services",
    failedToCreateAgent: "Failed to create agent",
    amountValidation:
      "Amount due must be greater than or equal to service price",
    paymentValidation: "Amount paid cannot exceed amount due",
    serviceAddedSuccess: "✅ Service added and balance updated successfully!",
    ticketAddedSuccess: "✅ Ticket added and balance updated successfully!",
    additionError: "Error occurred during addition",
    addNewTicket: "Add New Ticket",
    addNewService: "Add New Service",
    servicePrice: "Service Price",
    paidFromWallet: "Paid from Wallet",
    addAgentsFromSettings: "Please add agents from settings first",
    servicesAutoAssign:
      "For services: current user is automatically assigned as seller",
    ticketsRequireSelection:
      "For tickets: must select seller and payment amount from their wallet",
    fullPaymentDescription: "Full payment: entire amount due is paid",
    partialPaymentDescription:
      "Partial payment: part of amount due is paid, remainder stays as debt",
    usdBaseCurrencyNote: "All amounts are saved in USD as base currency",

    // Settings
    currencyCodePlaceholder: "Currency code (e.g: SAR)",
    currencyNamePlaceholder: "Currency name (e.g: Saudi Riyal)",
    currencySymbolPlaceholder: "Currency symbol (e.g: SR)",
    exchangeRatePlaceholder: "Exchange rate against USD (e.g: 3.75)",
    currencyCode: "Currency Code",
    currencyName: "Currency Name",
    exchangeRate: "Exchange Rate Against USD",
    serviceNamePlaceholder: "Service name (e.g: Tourist Visa)",
    servicePricePlaceholder: "Service price in USD (e.g: 100)",
    servicePriceUSD: "Service Price in USD",
    addCurrency: "Add Currency",
    addService: "Add Service",
    addNewCurrency: "Add New Currency",
    editCurrency: "Edit Currency",
    usdNote:
      "Note: USD is the base currency and its value cannot be edited or disabled",
    confirmDeletion: "Confirm Deletion",
    currencyDeletionConfirm:
      "Are you sure you want to delete this currency? This action cannot be undone.",
    deleteCurrency: "Delete Currency",
    addNewService: "Add New Service",
    editService: "Edit Service",
    serviceDeletionConfirm:
      "Are you sure you want to delete this service? This action cannot be undone.",
    currencyAdditionError: "Error occurred while adding currency",
    failedToAddCurrency: "Failed to add currency",
    cannotDeleteUSD: "Cannot delete USD (base currency)",
    currencyDeletedSuccess: "Currency deleted successfully!",
    failedToDeleteCurrency: "Failed to delete currency",
    serviceAddedSuccess: "Service added successfully!",
    serviceAdditionError: "Error occurred while adding service",
    failedToAddService: "Failed to add service",
    serviceDeletedSuccess: "Service deleted successfully!",
    failedToDeleteService: "Failed to delete service",
    adding: "Adding...",
    addCurrencyButton: "Add Currency",
    updating: "Updating...",

    // Users Management
    username: "Username",
    passwordValidation: "Password (6 characters minimum)",
    manageBalance: "Manage Balance",
    payFromBalance: "Pay from Balance",
    editUser: "Edit User",
    deleteUser: "Delete User",
    userDetails: "User Details",
    addNewUser: "Add New User",
    editUserData: "Edit User Data",
    confirmUserDeletion: "Confirm Deletion",
    manageUserBalance: "Manage User Balance",
    payDebtFromBalance: "Pay Debt from User Balance",
    enterUsername: "Please enter username.",
    userNotFound: "User not found.",
    userUpdatedSuccess: "User data updated successfully!",
    userUpdateError: "Error occurred while updating user.",
    failedToUpdateUser: "Failed to update user",
    userDeletedSuccess: "User deleted successfully!",
    failedToDeleteUser: "Failed to delete user",
    enterValidAmount: "Please enter valid amount",
    insufficientBalance: "Insufficient user balance",
    userBalanceUpdated: "User balance updated successfully!",
    balanceUpdateError: "Error occurred while updating balance",
    failedToUpdateBalance: "Failed to update balance",
    selectTicket: "Please select ticket",
    failedToPayFromBalance: "Failed to pay from balance",
    paymentError: "Error occurred while making payment",

    // Dashboard
    dataLoadingError: "Error loading data",
    reloadPageMessage: "Please reload the page or try again later",
    generalStatistics: "General Statistics",
    totalUsers: "Total Users",
    issuedTicketsAndServices: "Issued {{totalTickets}} tickets and services",
    amountsDue: "Amounts Due",
    amountsPaid: "Amounts Paid",
    netProfit: "Net Profit",
    thisMonthStatistics: "This Month's Statistics",
    addNewAgent: "Add New Agent",
    enterAgentName: "Enter agent name",
    updateAgentBalance: "Update Agent Balance",
    confirmAgentDeletion: "Confirm Agent Deletion",
    agentDeletionConfirm:
      "Are you sure you want to delete this agent? This action cannot be undone.",
    balance: "Balance",

    // Tickets and Services Management
    ticketsAndServicesManagement: "Tickets and Services Management",
    viewAndControlAll: "View and control all tickets and services",
    viewTickets: "View Tickets",
    viewServices: "View Services",

    // Modern Interface
    ticketManagement: "Ticket Management",
    ticketsInSystem: "{{count}} tickets in system",
    home: "Home",
    ticketNumberPlaceholder: "Ticket number...",
    selectUser: "Select User",
    ticketDetails: "Ticket Details",
    confirmTicketDeletion: "Confirm Ticket Deletion",
    ticketDeletionConfirm:
      "Are you sure you want to delete this ticket? This action cannot be undone.",
    userManagement: "User Management",
    usersInSystem: "{{count}} users registered in system",
    searchForUser: "Search for user...",
    addNewUserButton: "Add New User",
    confirmUserDeletionModal: "Confirm User Deletion",
    userDeletionConfirm:
      "Are you sure you want to delete this user? This action cannot be undone.",
    enterFullName: "Enter full name",
    emailPlaceholder: "user@example.com",
    strongPasswordPlaceholder: "Strong password (6 characters minimum)",

    // Chat
    typeYourMessage: "Type your message...",
    starredMessages: "Starred Messages",
    markWithStar: "Mark with Star",
    addEmoji: "Add Emoji",
    replyingTo: "Replying to: {{senderName}} — {{text}}...",
    replyToUser: "Reply to {{senderName}}: {{text}}...",

    // Logs
    searchInLog: "Search in log...",
    updateLog: "Update Log",
    failedToLoadActivityLog: "Failed to load activity log",
    failedToLoadTicketLog: "Failed to load ticket log",

    // Loading and Errors
    anErrorOccurred: "An error occurred",
    pleaseReloadPage: "Please reload the page",
    pleaseWaitMoment: "Please wait a moment",
    unknownUserRole: "Unknown user role",
    contactAdminForPermissions: "Please contact admin to set permissions",
    reloadPage: "Reload Page",

    // PWA
    newUpdateAvailable: "New update available",
    readyToWorkOffline: "Ready to work offline",

    // Additional Service Tickets
    serviceTicketUpdated: "Service ticket updated as paid ✅",
    failedToUpdateServiceTicket: "Failed to update service ticket",
    cannotEditClosedServiceTicket: "Cannot edit closed service ticket",
    editServiceTicket: "Edit Service Ticket",
    serviceAmountValidation:
      "Amount due must be greater than or equal to service price",

    // Agent Dashboard
    errorLoadingTickets: "Error loading tickets",
    viewBalanceDetails: "View Balance Details",
    balanceMovementDetails: "Balance Movement Details",
    failedToLoadBalanceLog: "Failed to load balance log",
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
    createdAt: "تاريخ الإنشاء",
    updatedAt: "تاريخ التحديث",

    // Language Switcher
    language: "اللغة",
    english: "English",
    arabic: "العربية",
    switchLanguage: "تغيير اللغة",

    // Profile
    logoutSuccess: "🚪 تم تسجيل الخروج بنجاح",
    logoutError: "❌ حدث خطأ أثناء تسجيل الخروج",
    imageUploadSuccess: "تم رفع الصورة بنجاح",
    imageUploadError: "فشل رفع الصورة",
    updateSuccess: "تم التحديث بنجاح",
    updateError: "فشل التحديث",
    name: "الاسم",
    preferredCurrency: "العملة المفضلة",
    selectPreferredCurrency: "اختر العملة المفضلة",
    currencyDescription: "ستظهر جميع المبالغ في التطبيق بهذه العملة",
    saveChanges: "حفظ التعديلات",

    // Agent - Add Ticket/Service
    loadingAgentsMessage: "جار تحميل بيانات الوكلاء، يرجى الانتظار...",
    loginRequired: "يرجى تسجيل الدخول أولاً",
    failedToLoadAgents: "فشل في تحميل بيانات الوكلاء. يرجى إعادة المحاولة.",
    noAgentsAvailable: "لا توجد بيانات وكلاء متاحة. يرجى إضافة وكلاء أولاً.",
    ticketNumberRequired: "يرجى تعبئة رقم التذكرة/الخدمة",
    selectSellerRequired: "يرجى اختيار البائع",
    selectUserRequired: "يرجى اختيار المستخدم الذي حرر التذكرة",
    enterRequiredAmounts: "يرجى إدخال المبالغ المطلوبة",
    selectServiceRequired: "يرجى اختيار الخدمة",
    failedToLoadServices: "فشل في تحميل الخدمات",
    failedToCreateAgent: "فشل في إنشاء بيانات الوكيل",
    amountValidation: "المبلغ المستحق يجب أن يكون أكبر من أو يساوي سعر الخدمة",
    paymentValidation: "المبلغ المدفوع لا يمكن أن يتجاوز المبلغ المستحق",
    serviceAddedSuccess: "✅ تم إضافة الخدمة وتحديث الرصيد بنجاح!",
    ticketAddedSuccess: "✅ تم إضافة التذكرة وتحديث الرصيد بنجاح!",
    additionError: "حدث خطأ أثناء الإضافة",
    addNewTicket: "إضافة تذكرة جديدة",
    addNewService: "إضافة خدمة جديدة",
    servicePrice: "سعر الخدمة",
    paidFromWallet: "المدفوع من المحفظة",
    addAgentsFromSettings: "يرجى إضافة وكلاء من الإعدادات أولاً",
    servicesAutoAssign: "للخدمات: يتم تعيين المستخدم الحالي كبائع تلقائياً",
    ticketsRequireSelection: "للتذاكر: يجب اختيار البائع ومبلغ الدفع من محفظته",
    fullPaymentDescription: "السداد الكامل: يتم دفع كامل المبلغ المستحق",
    partialPaymentDescription:
      "السداد الجزئي: يتم دفع جزء من المبلغ المستحق والباقي يبقى كدين",
    usdBaseCurrencyNote: "جميع المبالغ تُحفظ بالدولار كعملة أساسية",

    // Settings
    currencyCodePlaceholder: "رمز العملة (مثل: SAR)",
    currencyNamePlaceholder: "اسم العملة (مثل: الريال السعودي)",
    currencySymbolPlaceholder: "رمز العملة (مثل: ر.س)",
    exchangeRatePlaceholder: "قيمة الصرف مقابل الدولار (مثل: 3.75)",
    currencyCode: "رمز العملة",
    currencyName: "اسم العملة",
    exchangeRate: "قيمة الصرف مقابل الدولار",
    serviceNamePlaceholder: "اسم الخدمة (مثل: تأشيرة سياحية)",
    servicePricePlaceholder: "سعر الخدمة بالدولار (مثل: 100)",
    servicePriceUSD: "سعر الخدمة بالدولار",
    addCurrency: "إضافة عملة",
    addService: "إضافة خدمة",
    addNewCurrency: "إضافة عملة جديدة",
    editCurrency: "تعديل العملة",
    usdNote:
      "ملاحظة: الدولار هو العملة الأساسية ولا يمكن تعديل قيمته أو تعطيله",
    confirmDeletion: "تأكيد الحذف",
    currencyDeletionConfirm:
      "هل أنت متأكد أنك تريد حذف هذه العملة؟ هذا الإجراء لا يمكن التراجع عنه.",
    deleteCurrency: "حذف العملة",
    addNewService: "إضافة خدمة جديدة",
    editService: "تعديل الخدمة",
    serviceDeletionConfirm:
      "هل أنت متأكد أنك تريد حذف هذه الخدمة؟ هذا الإجراء لا يمكن التراجع عنه.",
    currencyAdditionError: "حدث خطأ أثناء إضافة العملة",
    failedToAddCurrency: "فشل في إضافة العملة",
    cannotDeleteUSD: "لا يمكن حذف الدولار (العملة الأساسية)",
    currencyDeletedSuccess: "تم حذف العملة بنجاح!",
    failedToDeleteCurrency: "فشل في حذف العملة",
    serviceAddedSuccess: "تم إضافة الخدمة بنجاح!",
    serviceAdditionError: "حدث خطأ أثناء إضافة الخدمة",
    failedToAddService: "فشل في إضافة الخدمة",
    serviceDeletedSuccess: "تم حذف الخدمة بنجاح!",
    failedToDeleteService: "فشل في حذف الخدمة",
    adding: "جاري الإضافة...",
    addCurrencyButton: "إضافة العملة",
    updating: "جاري التحديث...",

    // Users Management
    username: "اسم المستخدم",
    passwordValidation: "كلمة المرور (6 أحرف على الأقل)",
    manageBalance: "إدارة الرصيد",
    payFromBalance: "دفع من الرصيد",
    editUser: "تعديل المستخدم",
    deleteUser: "حذف المستخدم",
    userDetails: "تفاصيل المستخدم",
    addNewUser: "إضافة مستخدم جديد",
    editUserData: "تعديل بيانات المستخدم",
    confirmUserDeletion: "تأكيد الحذف",
    manageUserBalance: "إدارة رصيد المستخدم",
    payDebtFromBalance: "دفع دين من رصيد المستخدم",
    enterUsername: "يرجى إدخال اسم المستخدم.",
    userNotFound: "لم يتم العثور على المستخدم.",
    userUpdatedSuccess: "تم تحديث بيانات المستخدم بنجاح!",
    userUpdateError: "حدث خطأ أثناء تحديث المستخدم.",
    failedToUpdateUser: "فشل في تحديث المستخدم",
    userDeletedSuccess: "تم حذف المستخدم بنجاح!",
    failedToDeleteUser: "فشل في حذف المستخدم",
    enterValidAmount: "يرجى إدخال مبلغ صحيح",
    insufficientBalance: "رصيد المستخدم غير كافي",
    userBalanceUpdated: "تم تحديث رصيد المستخدم بنجاح!",
    balanceUpdateError: "حدث خطأ أثناء تحديث الرصيد",
    failedToUpdateBalance: "فشل في تحديث الرصيد",
    selectTicket: "يرجى اختيار تذكرة",
    failedToPayFromBalance: "فشل في دفع المبلغ من الرصيد",
    paymentError: "حدث خطأ أثناء دفع المبلغ",

    // Dashboard
    dataLoadingError: "خطأ في تحميل البيانات",
    reloadPageMessage: "يرجى إعادة تحميل الصفحة أو المحاولة لاحقاً",
    generalStatistics: "الإحصائيات العامة",
    totalUsers: "إجمالي المستخدمين",
    issuedTicketsAndServices: "أصدروا {{totalTickets}} تذكرة وخدمة",
    amountsDue: "المبالغ المستحقة",
    amountsPaid: "المبالغ المدفوعة",
    netProfit: "صافي الربح",
    thisMonthStatistics: "إحصائيات هذا الشهر",
    addNewAgent: "إضافة وكيل جديد",
    enterAgentName: "أدخل اسم الوكيل",
    updateAgentBalance: "تحديث رصيد الوكيل",
    confirmAgentDeletion: "تأك��د حذف الوكيل",
    agentDeletionConfirm:
      "هل أنت متأكد أنك تريد حذف هذا الوكيل؟ لا يمكن التراجع عن هذا الإجراء.",
    balance: "الرصيد",

    // Tickets and Services Management
    ticketsAndServicesManagement: "إدارة التذاكر والخدمات",
    viewAndControlAll: "عرض وتحكم في جميع التذاكر والخدمات",
    viewTickets: "عرض التذاكر",
    viewServices: "عرض الخدمات",

    // Modern Interface
    ticketManagement: "إدارة التذاكر",
    ticketsInSystem: "{{count}} تذكرة في النظام",
    home: "الرئيسية",
    ticketNumberPlaceholder: "رقم التذكرة...",
    selectUser: "اختر المستخدم",
    ticketDetails: "تفاصيل التذكرة",
    confirmTicketDeletion: "تأكيد حذف التذكرة",
    ticketDeletionConfirm:
      "هل أنت متأكد أنك تريد حذف هذه التذكرة؟ لا يمكن التراجع عن هذا الإجراء.",
    userManagement: "إدارة المستخدمين",
    usersInSystem: "{{count}} مستخدم مسجل في النظام",
    searchForUser: "البحث عن مستخدم...",
    addNewUserButton: "إضافة مستخدم جديد",
    confirmUserDeletionModal: "تأكيد حذف المستخدم",
    userDeletionConfirm:
      "هل أنت متأكد أنك تريد حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.",
    enterFullName: "أدخل الاسم الكامل",
    emailPlaceholder: "user@example.com",
    strongPasswordPlaceholder: "كلمة مرور قوية (6 أحرف على الأقل)",

    // Chat
    typeYourMessage: "اكتب رسالتك...",
    starredMessages: "الرسائل المعلمة بنجمة",
    markWithStar: "تعليم بنجمة",
    addEmoji: "إضافة إيموجي",
    replyingTo: "ردًا على: {{senderName}} — {{text}}...",
    replyToUser: "الرد على {{senderName}}: {{text}}...",

    // Logs
    searchInLog: "البحث في السجل...",
    updateLog: "تحديث السجل",
    failedToLoadActivityLog: "فشل في تحميل سجل الأنشطة",
    failedToLoadTicketLog: "فشل في تحميل سجل التذكرة",

    // Loading and Errors
    anErrorOccurred: "حدث خطأ",
    pleaseReloadPage: "يرجى إعادة تحميل الصفحة",
    pleaseWaitMoment: "يرجى الانتظار قليلاً",
    unknownUserRole: "دور المستخدم غير معروف",
    contactAdminForPermissions: "يرجى التواصل مع المدير لتحديد الصلاحيات",
    reloadPage: "إعادة تحميل الصفحة",

    // PWA
    newUpdateAvailable: "تحديث جديد متاح",
    readyToWorkOffline: "جاهز للعمل بدون إنترنت",

    // Additional Service Tickets
    serviceTicketUpdated: "تم تحديث تذكرة الخدمة كمدفوعة ✅",
    failedToUpdateServiceTicket: "فشل في تحديث تذكرة الخدمة",
    cannotEditClosedServiceTicket: "لا يمكن تعديل تذكرة خدمة مغلقة",
    editServiceTicket: "تعديل تذكرة الخدمة",
    serviceAmountValidation:
      "المبلغ المستحق يجب أن يكون أكبر من أو يساوي سعر الخدمة",

    // Agent Dashboard
    errorLoadingTickets: "حدث خطأ أثناء تحميل التذاكر",
    viewBalanceDetails: "عرض تفاصيل الرصيد",
    balanceMovementDetails: "تفاصيل حركات الرصيد",
    failedToLoadBalanceLog: "فشل في تحميل سجل الرصيد",
  },
};
