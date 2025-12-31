import { CRDTDataType, MERGE } from "../../../Interface/WebSocket";
import { HiddenAndLenModelType } from "../../../Sequelize/Models/HiddenAndLen";
import { WorkerSheetModelType } from "../../../Sequelize/Models/WorkerSheet";
import { HiddenAndLenService } from "../../../Service/HiddenAndLen";
import { ImageService } from "../../../Service/Image";
import { MergeService } from "../../../Service/Merge";
import { WorkerSheetService } from "../../../Service/WorkerSheet";
import { isEmpty } from "../../../Utils";
import { logger } from "../../../Utils/Logger";

/**
 * 通用保存 冻结行列、修改工作表名、修改工作表颜色、合并单元格、筛选等操作，
 *  此方法仅处理 修改工作表名 合并单元格
 * @param data
 * @returns
 */
export async function all(data: string) {
	logger.info("[CRDT DATA]:", data);

	const { t, i, v, k } = <CRDTDataType<MERGE>>JSON.parse(data);

	if (t !== "all") return logger.error("t is not all.");
	if (isEmpty(i)) return logger.error("i is undefined.");

	// 修改工作表名
	//  {"t":"all","i":"12f8254d-3914-4f79-9886-9f9aec173048","v":"123","k":"name"}
	if (k === "name") {
		const info = <WorkerSheetModelType>{
			worker_sheet_id: i,
			name: <string>(<unknown>v),
		};
		await WorkerSheetService.update(info);
	} else if (k === "config") {
		// 合并单元格 - 又是一个先删除后新增的操作，由luckysheet 前台设计决定的
		// {"t":"all","i":"e73f971....","v":{"merge":{"1_0":{"r":1,"c":0,"rs":3,"cs":3}},},"k":"config"}
		// {"t":"all","i":"e73f971....","v":{"merge":{"1_0":{"r":1,"c":0,"rs":3,"cs":3},"9_1":{"r":9,"c":1,"rs":5,"cs":3}},},"k":"config"}
		// {"t":"all","i":"e73f971....","v":{"merge":{"9_1":{"r":9,"c":1,"rs":5,"cs":3}},},"k":"config"}

		// 如果当前 sheet 没有 merge 属性，则表示最后一个合并单元格被取消，则删除当前 sheetindex 下的所有 merge 记录
		// 删除当前 sheet Index 下的所有merge 记录
		await MergeService.deleteMerge(i);
		// 如果有记录 再新增
		if (v && v.merge && Object.keys(v.merge).length) {
			// 再新增
			for (const key in v.merge) {
				if (Object.prototype.hasOwnProperty.call(v.merge, key)) {
					const { r, c, rs, cs } = v.merge[key];
					await MergeService.createMerge({
						worker_sheet_id: i,
						r,
						c,
						rs,
						cs,
					});
				}
			}
		}

		// 文本换行处理方式 - 自动换行是通过自定义行高实现的，这部分也需要存储哈
		// {"t":"all","i":"28a60885-46e3-4f59-9d25-442a30fdbba6","v":{"merge":{},"rowhidden":{},"colhidden":{},"borderInfo":[],"rowlen":{"10":63.5},"columnlen":{},"customHeight":{}},"k":"config"}
		if (v && v.rowlen && Object.keys(v.rowlen).length) {
			// "rowlen":{"10":63.5},
			for (const key in v.rowlen) {
				if (Object.prototype.hasOwnProperty.call(v.rowlen, key)) {
					const value = Number(v.rowlen[key]);
					// 此时 key 是行号，value 是行高
					const configInfo: HiddenAndLenModelType = {
						worker_sheet_id: i,
						config_index: key,
						config_type: "rowlen",
						config_value: value,
					};
					await HiddenAndLenService.create(configInfo);
				}
			}
		}
	} else if (k === "images") {
		//  {"t":"all","i":"4735b996-d89d-4d7f-ad8e-1124bccc89b0","v":{
		// "img_3aaW3S653e10_1733991741264":{"type":"3","src":"/uploads/36399c90241d782399d05acd9dfb1d9d.png","originWidth":685,"originHeight":490,"default":{"width":400,"height":286,"left":18,"top":229},"crop":{"width":400,"height":286,"offsetLeft":0,"offsetTop":0},"isFixedPos":false,"fixedLeft":46,"fixedTop":90,"border":{"width":0,"radius":0,"style":"solid","color":"#000"}},
		// "img_eeeKop3oTl3a_1733991749199":{"type":"3","src":"/uploads/31ae8c6088f50c267a09b00b3555d787.png","originWidth":685,"originHeight":386,"default":{"width":400,"height":225,"left":0,"top":171},"crop":{"width":400,"height":225,"offsetLeft":0,"offsetTop":0},"isFixedPos":false,"fixedLeft":46,"fixedTop":90,"border":{"width":0,"radius":0,"style":"solid","color":"#000"}}
		// },"k":"images"}
		/* eslint-disable */
		//  又是一个先删除后新增的操作
		await ImageService.deleteImage(i);
		for (const key in v) {
			if (Object.prototype.hasOwnProperty.call(v, key)) {
				// @ts-ignore
				const value = v[key];
				// 解析 value 值
				await ImageService.createImage({
					image_key: key,
					worker_sheet_id: i,
					image_type: value.type, // type 1移动并调整单元格大小 2移动并且不调整单元格的大小 3不要移动单元格并调整其大小
					image_src: value.src, // 图片地址
					in_cell: value.inCell || false, // 所在单元格位置
					image_originWidth: value.originWidth, // 原始宽度
					image_originHeight: value.originHeight, // 原始高度
					image_default_width: value.default.width, // 默认宽度
					image_default_height: value.default.height, // 默认高度
					image_default_left: value.default.left, // 默认左边距
					image_default_top: value.default.top, // 默认上边距
					image_crop_width: value.crop.width, // 裁剪宽度
					image_crop_height: value.crop.height, // 裁剪高度
					image_crop_offsetLeft: value.crop.offsetLeft, // 裁剪左边距
					image_crop_offsetTop: value.crop.offsetTop, // 裁剪上边距
					image_isFixedPos: value.isFixedPos, // 是否固定位置
					image_fixedLeft: value.fixedLeft, // 固定左边距
					image_fixedTop: value.fixedTop, // 固定上边距
					image_border_width: value.border.width, // 边框宽度
					image_border_radius: value.border.radius, // 圆角
					image_border_style: value.border.style, // 边框样式
					image_border_color: value.border.color, // 边框颜色
				});
			}
		}
	} else if (k === "color") {
		// {"t":"all","i":"62e09f1d-b294-46b5-8924-a0f1a8e011a2","v":"#ffff00","k":"color"}
		// 更新 worker sheet color 字段即可
		const color_info = <WorkerSheetModelType>{
			worker_sheet_id: i,
			color: <string>(<unknown>v),
		};
		await WorkerSheetService.update(color_info);
	}
}
