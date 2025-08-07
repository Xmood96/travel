import React, { useState } from "react";
import { useAppData } from "../../api/useAppData";
import { Modal } from "../ui/modal";
import { Button } from "../ui/botom";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const handleUpdate = () => {
    updateAgentBalance.mutate(
      { id: agentId, newBalance },
      {
        onSuccess: () => alert(t("updatedSuccessfully")),
      }
    );
  };

  return (
    <div>
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={t("updateAgentBalance")}
      >
        <div className="space-y-3">
          <input
            type="number"
            value={newBalance}
            onChange={(e) => setNewBalance(Number(e.target.value))}
            placeholder={t("newBalance")}
            className="input input-bordered w-full"
          />

          <Button
            onClick={() => {
              setAddModalOpen(false);
              handleUpdate();
            }}
          >
              {t("update")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
