// 删除sheet - 不可以直接删除记录，因为还需要恢复，应该标记 deleteFlag 属性即可
// celldata可能存在外键关联，请注意删除顺序

import { CRDTDataType } from "../../../Interface/WebSocket";
import { WorkerSheetModelType } from "../../../Sequelize/Models/WorkerSheet";
import { WorkerSheetService } from "../../../Service/WorkerSheet";
import { logger } from "../../../Utils/Logger";

// 请注意： 删除 Sheet 请真实删除 celldata 数据
export async function shd(data: string) {
	logger.info("[CRDT DATA]:", data);
	const { t, v } = <CRDTDataType<{ deleIndex: string }>>JSON.parse(data);
	if (t !== "shd") return logger.error("t is not shd.");
	// {"t":"shd","i":null,"v":{"deleIndex":"Sheet_06ok13WM3kS3_1734398401711"}}
	// 更新 deleteFlag = true
	const info = <WorkerSheetModelType>{
		worker_sheet_id: v.deleIndex,
		deleteFlag: true,
	};
	await WorkerSheetService.update(info);
}
