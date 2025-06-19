import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MessageCircle, SendHorizonal } from "lucide-react";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";

import { Timestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../api/Firebase";

type MessageType = {
  id: string;
  text: string;
  createdAt: Timestamp | null;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  reactions?: { [userId: string]: string };
  seenBy?: string[];
};

const Chat = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [unreadCount, setUnreadCount] = useState(0);

  // جلب الرسائل
  useEffect(() => {
    const q = query(collection(db, "chat"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: MessageType[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<MessageType, "id">),
      }));
      setMessages(msgs);

      if (user) {
        const unread = msgs.filter(
          (msg) =>
            msg.senderId !== user.id &&
            (!msg.seenBy || !msg.seenBy.includes(user.id))
        ).length;

        if (!open) setUnreadCount(unread);
      }
    });

    return () => unsubscribe();
  }, [user, open]);

  useEffect(() => {
    if (open && user) {
      messages.forEach((msg) => {
        if (
          msg.senderId !== user.id &&
          (!msg.seenBy || !msg.seenBy.includes(user.id))
        ) {
          const msgRef = doc(db, "chat", msg.id);
          updateDoc(msgRef, {
            seenBy: [...(msg.seenBy || []), user.id],
          });
        }
      });

      setUnreadCount(0);
    }
  }, [open, user, messages]);

  // تمرير لآخر رسالة عند التحديث
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !user) return;

    await addDoc(collection(db, "chat"), {
      text: input.trim(),
      createdAt: serverTimestamp(),
      senderId: user.id,
      senderName: user.name,
      senderPhoto: user.photoURL,
      reactions: {},
      seenBy: [user.id],
    });

    setInput("");
  };

  return (
    <>
      {/* زر الأيقونة */}
      <button
        className="fixed bottom-12 left-2 z-50 p-3 rounded-full bg-blue-300 text-white shadow-lg hover:bg-blue-700 transition"
        onClick={() => setOpen(!open)}
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-700 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* نافذة الشات */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 right-4 w-[90%] max-w-sm bg-white border rounded-2xl shadow-2xl z-50 flex flex-col h-[450px]"
        >
          {/* رأس المحادثة */}
          <div className="p-3 border-b text-base font-semibold bg-blue-300 text-white rounded-t-2xl">
            الدردشة الجماعية
          </div>

          {/* الرسائل */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 bg-slate-300">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.senderId === user?.id ? "justify-end" : "justify-start"
                }`}
              >
                <div className="flex items-end gap-2 max-w-[75%]">
                  {/* صورة المرسل */}
                  {msg.senderId !== user?.id && (
                    <img
                      src={msg.senderPhoto}
                      alt={msg.senderName}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  )}
                  {/* فقاعة الرسالة */}
                  <div
                    className={`px-4 py-2 rounded-2xl text-sm leading-relaxed shadow relative
                    ${
                      msg.senderId === user?.id
                        ? "bg-blue-300 text-black rounded-br-none"
                        : "bg-gray-200 text-gray-900  rounded-bl-none"
                    }`}
                  >
                    {/* اسم المرسل */}
                    {msg.senderId !== user?.id && (
                      <div className="text-xs font-semibold text-gray-500 mb-1">
                        {msg.senderName}
                      </div>
                    )}
                    {/* نص الرسالة */}
                    {msg.text}
                    {/* إيموجيات الريأكشن */}

                    {/* حالة Seen */}
                    {msg.senderId === user?.id &&
                      (msg.seenBy?.length || 0) > 1 && (
                        <div className="text-[10px] text-gray-500 mt-1">
                          تمت القراءة
                        </div>
                      )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* إدخال الرسالة */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center border-t px-2 py-2 bg-blue-300"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب رسالتك..."
              className="flex-1 px-3 py-2 rounded-full border bg-gray-200 text-black focus:outline-none"
            />
            <button type="submit" className="ml-2 p-2 text-blue-700">
              <SendHorizonal className="w-5 h-5" />
            </button>
          </form>
        </motion.div>
      )}
    </>
  );
};

export default Chat;
