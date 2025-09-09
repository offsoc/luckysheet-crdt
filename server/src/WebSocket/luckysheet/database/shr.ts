import { CRDTDataType } from "../../../Interface/WebSocket";
import { WorkerSheetModelType } from "../../../Sequelize/Models/WorkerSheet";
import { WorkerSheetService } from "../../../Service/WorkerSheet";
import { logger } from "../../../Utils/Logger";

// 调整sheet位置
export async function shr(data: string) {
	// {"t":"shr","i":null,"v":{"12f8254d-3914-4f79-9886-9f9aec173048":0,"Sheet_0NHdie3o0ba5_1734351308939":1,"Sheet_oi07n566135m_1734351229761":2}}
	logger.info("[CRDT DATA]:", data);
	const { t, v } = <CRDTDataType<{ [key: string]: number }>>JSON.parse(data);
	if (t !== "shr") return logger.error("t is not shr.");

	// 循环调整位置
	for (const i in v) {
		if (Object.prototype.hasOwnProperty.call(v, i)) {
			const order = v[i];
			// 调整位置
			const info = <WorkerSheetModelType>{ worker_sheet_id: i, order };
			await WorkerSheetService.update(info);
		}
	}
}
