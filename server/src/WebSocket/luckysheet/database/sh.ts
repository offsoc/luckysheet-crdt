import { CRDTDataType } from "../../../Interface/WebSocket";
import { WorkerSheetModelType } from "../../../Sequelize/Models/WorkerSheet";
import { WorkerSheetService } from "../../../Service/WorkerSheet";
import { isEmpty } from "../../../Utils";
import { logger } from "../../../Utils/Logger";

// sheet属性(隐藏或显示)
export async function sh(data: string) {
	// {"t":"sh","i":"Sheet_06ok13WM3kS3_1734398401711","v":1,"op":"hide","cur":"Sheet_ieo3iK3lo0m3_1734353939113"}
	logger.info("[CRDT DATA]:", data);
	const { t, v, i } = <CRDTDataType<number>>JSON.parse(data);
	if (t !== "sh") return logger.error("t is not sh.");
	if (isEmpty(i)) return logger.error("i is empty.");

	// 更新 deleteFlag = false
	const info = <WorkerSheetModelType>{
		worker_sheet_id: i,
		hide: Boolean(v),
	};
	await WorkerSheetService.update(info);
}
