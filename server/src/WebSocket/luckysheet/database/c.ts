import { CRDTDataType, CHART } from "../../../Interface/WebSocket";
import { ChartService } from "../../../Service/Chart";
import { isEmpty } from "../../../Utils";
import { logger } from "../../../Utils/Logger";

// 图表操作
export async function c(data: string) {
	logger.info("[CRDT DATA]:", data);
	const { t, v, i, op } = <CRDTDataType<CHART>>JSON.parse(data);
	if (t !== "c") return logger.error("t is not c.");
	if (isEmpty(i)) return logger.error("i is undefined.");
	// 所有的图表ID均由前台传递
	// 创建图表
	const chartInfo = {
		chartType: v.chartType,
		worker_sheet_id: i,
		chart_id: v.chart_id,
		width: v.width,
		height: v.height,
		left: v.left,
		top: v.top,
		needRangeShow: v.needRangeShow,
		chartOptions: JSON.stringify(v.chartOptions),
	};
	if (op === "add") {
		await ChartService.createChart(chartInfo);
	}

	// 更新图表
	//  {"t":"c","i":"89357e56-c6bc-4de0-bfd1-0e00b3086da4","v":{"chart_id":"chart_01ieK40e4Kal_1734335434241","left":"172.3px","top":"158.3px","scrollTop":0,"scrollLeft":0},"cid":"chart_01ieK40e4Kal_1734335434241","op":"xy"}
	else if (op === "xy" || op === "wh") {
		await ChartService.updateChart({
			chartType: v.chartType,
			worker_sheet_id: i,
			chart_id: v.chart_id,
			left: v.left,
			top: v.top,
			width: v.width,
			height: v.height,
		});
	}

	// 更新图表配置
	else if (op === "update") {
		await ChartService.updateChart({
			chartType: v.chartType,
			worker_sheet_id: i,
			chart_id: v.chart_id,
			chartOptions: JSON.stringify(v.chartOptions),
		});
	}

	// 删除图表
	// {"t":"c","i":"89357e56-c6bc-4de0-bfd1-0e00b3086da4","v":{"cid":"chart_WW0t3io1towN_1734335743092"},"cid":"chart_WW0t3io1towN_1734335743092","op":"del"}
	else if (op === "del") {
		await ChartService.deleteChart(v.chart_id);
	}

	// TODO:
	// 图表更新单元格数据 update_data
	// {"t":"c","i":0,"v":{"r_st":1,"r_ed":1,"c_st":1,"c_ed":1,chart_id:"",chartOptions:""},"op":"update_data"}
	else if (op === "update_data") {
		// 更新 ChartModel options 配置项
		await ChartService.updateChart({
			chartType: v.chartType,
			worker_sheet_id: i,
			chart_id: v.chart_id,
			chartOptions: JSON.stringify(v.chartOptions),
		});
	}
}
