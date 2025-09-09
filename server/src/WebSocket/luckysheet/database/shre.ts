import { CRDTDataType } from "../../../Interface/WebSocket";
import { WorkerSheetModelType } from "../../../Sequelize/Models/WorkerSheet";
import { WorkerSheetService } from "../../../Service/WorkerSheet";
import { logger } from "../../../Utils/Logger";

// 删除sheet后恢复操作
export async function shre(data: string) {
	// {"t":"shre","i":null,"v":{"reIndex":"Sheet_06ok13WM3kS3_1734398401711"}}
	logger.info("[CRDT DATA]:", data);
	const { t, v } = <CRDTDataType<{ reIndex: string }>>JSON.parse(data);
	if (t !== "shre") return logger.error("t is not shre.");
	// 更新 deleteFlag = false
	const info = <WorkerSheetModelType>{
		worker_sheet_id: v.reIndex,
		deleteFlag: false,
	};
	await WorkerSheetService.update(info);
}
