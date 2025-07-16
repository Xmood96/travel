import React, { useState } from "react";
import { useAppData } from "../../api/useAppData";
import { Modal } from "../ui/modal";
import { Button } from "../ui/botom";

export function UpdateAgentBalance({
  agentId,
  currentBalance,
}: {
  agentId: string;
  currentBalance: number;
}) {
  const { updateAgentBalance } = useAppData();
  const [newBalance, setNewBalance] = React.useState(currentBalance);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const handleUpdate = () => {
    updateAgentBalance.mutate(
      { id: agentId, newBalance },
      {
        onSuccess: () => alert("تم تحديث الرصيد"),
      }
    );
  };

  return (
    <div>
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="إضافة وكيل "
      >
        <div className="space-y-3">
          <input
            type="number"
            value={newBalance}
            onChange={(e) => setNewBalance(Number(e.target.value))}
            placeholder="الرصيد"
            className="input input-bordered w-full"
          />

          <Button
            onClick={() => {
              setAddModalOpen(false);
              handleUpdate();
            }}
          >
            تحديث
          </Button>
        </div>
      </Modal>
    </div>
  );
}
