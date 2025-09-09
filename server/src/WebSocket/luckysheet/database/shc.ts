import { CRDTDataType, SHA } from "../../../Interface/WebSocket";
import { WorkerSheetModelType } from "../../../Sequelize/Models/WorkerSheet";
import { BorderInfoService } from "../../../Service/Border";
import { CellDataService } from "../../../Service/CellData";
import { MergeService } from "../../../Service/Merge";
import { WorkerSheetService } from "../../../Service/WorkerSheet";
import { isEmpty } from "../../../Utils";
import { logger } from "../../../Utils/Logger";

// 复制sheet - 复制了sheet 后，应该从被复制 sheet 的 index 直接复制数据即可，不需要saveParam
export async function shc(data: string, gridKey: string) {
	// {"t":"shc","i":"Sheet_0NHdie3o0ba5_1734351308939","v":{"copyindex":"12f8254d-3914-4f79-9886-9f9aec173048","name":"Sheet(副本)"}}
	// 至于复制的sheet该放在什么位置上，会同步触发 shr 事件，调整sheet的位置
	logger.info("[CRDT DATA]:", data);
	const { t, i, v } = <CRDTDataType<SHA>>JSON.parse(data);
	if (t !== "shc") return logger.error("t is not shc.");
	if (isEmpty(i)) return logger.error("i is empty.");

	const copy_sheet_info: WorkerSheetModelType = {
		worker_sheet_id: i,
		name: v.name,
		gridKey,
	};
	await WorkerSheetService.createSheet(copy_sheet_info);

	// 真实实现复制 sheet 数据
	await copySheetData(v.copyindex!, i);
}

/**
 * 工具函数 - 复制 Sheet 时，需要同步被复制 sheet 的所有数据 borders、celldatas、charts、hidneandlens、images、merges
 * @param copyIndex 被复制的 sheet index
 * @param newSheetIndex 新 sheet index
 */
async function copySheetData(copyIndex: string, newSheetIndex: string) {
	// ==> copyIndex 25a110fd-8e06-4318-a2d2-c42606b266ee
	// ==> newSheetIndex Sheet_5330eTr735lz_1743664108612
	// 处理思路：先 查询当前被复制 sheet 的所有数据，然后批量插入到新 sheet 中
	// borders
	const copySheetBorder = await BorderInfoService.findAllBorder(copyIndex);
	if (copySheetBorder?.length) {
		for (let i = 0; i < copySheetBorder.length; i++) {
			const item = copySheetBorder[i].dataValues;
			delete item.config_border_id;
			// 批量插入到新 sheet 中
			await BorderInfoService.createConfigBorder({
				...item,
				worker_sheet_id: newSheetIndex,
			});
		}
	}

	// celldatas
	const copySheetCellData = await CellDataService.getCellData(copyIndex);
	if (copySheetCellData?.length) {
		for (let i = 0; i < copySheetCellData.length; i++) {
			const item = copySheetCellData[i].dataValues;
			delete item.cell_data_id;
			// 批量插入到新 sheet 中
			await CellDataService.createCellData({
				...item,
				worker_sheet_id: newSheetIndex,
			});
		}
	}

	// charts  hidneandlens  images 暂不处理 原理类似哈

	// merges
	const copySheetMerge = await MergeService.findAllMerge(copyIndex);
	if (copySheetMerge?.length) {
		for (let i = 0; i < copySheetMerge.length; i++) {
			const item = copySheetMerge[i].dataValues;
			delete item.config_merge_id;
			// 批量插入到新 sheet 中
			await MergeService.createMerge({
				...item,
				worker_sheet_id: newSheetIndex,
			});
		}
	}
}
