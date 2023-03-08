import { useMemo } from "react";
import { Form } from "react-bootstrap";
import { useAppDispatch } from "../../store";
import { useParticipantsHavingReadAccess } from "../../store/ChatSettingsHook";
import { toggleParticipantHasReadAccessLoad } from "../../store/ChatSettingsSlice";

const UserReadAccessSwitch = ({ chatId, participantId }: { chatId: string, participantId: string }) => {

    const dispatch = useAppDispatch();
    const { participantsHavingReadAccess, participantsHavingReadAccessPending } = useParticipantsHavingReadAccess({ chatId });
    const participantHasReadAccess = useMemo(
        () => participantsHavingReadAccess !== undefined && participantsHavingReadAccess.includes(participantId),
        [participantsHavingReadAccess, participantId]
    );

    const toggleUserReadAccess = (): void => {
        if (participantsHavingReadAccess) {
            dispatch(toggleParticipantHasReadAccessLoad({ chatId, participantId }));
        }
    }

    return (
        <Form>
            <Form.Check
                type="switch"
                disabled={participantsHavingReadAccess === undefined || participantsHavingReadAccessPending}
                checked={participantHasReadAccess}
                onChange={toggleUserReadAccess}
            />
        </Form>
    );
};

export default UserReadAccessSwitch;

