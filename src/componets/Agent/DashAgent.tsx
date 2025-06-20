import { AlertCircle, Loader2 } from "lucide-react";
import { IoTicket } from "react-icons/io5";
import { Card } from "../ui/card";
import AddTicketForm from "./Addtick";
import { useAuth } from "../../context/AuthContext";
import { useUserTickets } from "../../api/ticketbuid";
import { toast } from "react-toastify";

const DashAgent = () => {
  const { user } = useAuth();
  const { data: tickets, isLoading, isError } = useUserTickets(user?.id || "");
  if (isError) {
    toast.error("حدث خطأ أثناء تحميل التذاكر");
    return <div className="text-red-500 p-4">خطأ في تحميل البيانات</div>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="animate-spin w-6 h-6 text-primary" />
      </div>
    );
  }
  const unpaidTotal =
    tickets
      ?.filter((ticket) => !ticket.isPaid)
      .reduce((sum, ticket) => sum + Number(ticket.amountDue), 0) || 0;
  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      <Card className="flex items-center  gap-4 p-4 border-blue-400  border-s-4 ">
        <IoTicket className="w-6 h-6 text-blue-500" />
        <div>
          <p className=" text-slate-800 text-lg">التذاكر </p>
          <h2 className="text-lg font-bold text-blue-400">
            {tickets?.length} تذكره
          </h2>
        </div>
      </Card>
      <Card className="flex items-center  gap-4 p-4 border-red-600  border-s-4 ">
        <AlertCircle className="w-6 h-6 text-red-500" />
        <div>
          <p className=" text-slate-800 text-lg">مبالغ مستحقة </p>
          <h2 className="text-lg font-bold text-red-600">{unpaidTotal} ر.س</h2>
        </div>
      </Card>
      <AddTicketForm userId={user?.id} />
    </div>
  );
};

export default DashAgent;
