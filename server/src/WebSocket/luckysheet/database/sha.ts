import { CRDTDataType, SHA } from "../../../Interface/WebSocket";
import { BorderInfoModelType } from "../../../Sequelize/Models/BorderInfo";
import { CellDataModelType } from "../../../Sequelize/Models/CellData";
import { WorkerSheetModelType } from "../../../Sequelize/Models/WorkerSheet";
import { BorderInfoService } from "../../../Service/Border";
import { CellDataService } from "../../../Service/CellData";
import { HiddenAndLenService } from "../../../Service/HiddenAndLen";
import { MergeService } from "../../../Service/Merge";
import { WorkerSheetService } from "../../../Service/WorkerSheet";
import { logger } from "../../../Utils/Logger";

// 新建sheet
export async function sha(data: string, gridKey: string) {
    logger.info("[CRDT DATA]:", data);
    const { t, v } = <CRDTDataType<SHA>>JSON.parse(data);
    if (t !== "sha") return logger.error("t is not sha.");
    // 新建sheet 是没有i 的哈，别的操作关联 sheet 才有i
    // 此时！这个sheet应该关联的 workerBookID 从当前协同的用户身上获取哦~因为 clientInfo 始终保留着 gridkey userid username 属性
    // {"t":"sha","i":null,"v":{"name":"Sheet2","color":"","status":"0","order":1,"index":"Sheet_Liiwhe570zW3_1734350438656","celldata":[],"row":84,"column":60,"config":{},"pivotTable":null,"isPivotTable":false}}
    // 新建 sheet

    const new_sheet: WorkerSheetModelType = {
        worker_sheet_id: v.index,
        name: v.name,
        gridKey,
        order: v.order,
        status: Number(v.status),
        row: v.row,
        column: v.column,
    };
    await WorkerSheetService.createSheet(new_sheet);

    /**
     * 导入文件时，新建 sheet 内容是有记录的哈，因此，这里还需要处理 celldata config 等信息
     * {"t":"sha",
     *    "v":{
     *    "name":"Sheet1(副本)",
     *    "index":"Sheet_0lW156ie7mao_1735608633541",
     *    "celldata":[{"r":7,"c":6,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":7,"c":7,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":7,"c":8,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":7,"c":9,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":7,"c":10,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":8,"c":6,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":8,"c":7,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1,"v":"123"}},{"r":8,"c":8,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":8,"c":9,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":8,"c":10,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":9,"c":6,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":9,"c":7,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":9,"c":8,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":9,"c":9,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":9,"c":10,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":10,"c":6,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":10,"c":7,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":10,"c":8,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":10,"c":9,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1,"v":"123"}},{"r":10,"c":10,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":11,"c":6,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":11,"c":7,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":11,"c":8,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":11,"c":9,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":11,"c":10,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":12,"c":6,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":12,"c":7,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":12,"c":8,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":12,"c":9,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":12,"c":10,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":13,"c":6,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":13,"c":7,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":13,"c":8,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":13,"c":9,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}},{"r":13,"c":10,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}}],
     *    "row":84,"column":60,
     *    "config":{
     *        "borderInfo":[{"rangeType":"cell","value":{"row_index":7,"col_index":6,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":7,"col_index":7,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":7,"col_index":8,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":7,"col_index":9,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":7,"col_index":10,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":8,"col_index":6,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":8,"col_index":7,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":8,"col_index":8,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":8,"col_index":9,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":8,"col_index":10,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":9,"col_index":6,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":9,"col_index":7,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":9,"col_index":8,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":9,"col_index":9,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":9,"col_index":10,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":10,"col_index":6,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":10,"col_index":7,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":10,"col_index":8,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":10,"col_index":9,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":10,"col_index":10,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":11,"col_index":6,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":11,"col_index":7,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":11,"col_index":8,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":11,"col_index":9,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":11,"col_index":10,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":12,"col_index":6,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":12,"col_index":7,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":12,"col_index":8,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":12,"col_index":9,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":12,"col_index":10,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":13,"col_index":6,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":13,"col_index":7,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":13,"col_index":8,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":13,"col_index":9,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}},{"rangeType":"cell","value":{"row_index":13,"col_index":10,"l":{"style":1,"color":"#000000"},"r":{"style":1,"color":"#000000"},"t":{"style":1,"color":"#000000"},"b":{"style":1,"color":"#000000"}}}]
     *    },
     *    "pivotTable":null,
     *    "isPivotTable":false,
     *    "luckysheet_select_save":[{"row":[7,7],"column":[13,13],"sheetIndex":1}],
     *    "zoomRatio":1,
     *    "showGridLines":"1",
     *    "defaultColWidth":70,
     *    "defaultRowHeight":19,
     *    "calcChain":[]
     *    }
     * }
     */
    if (v.celldata) {
        // 注意 这里的 celldata 很多都是没有内容的，因此 需要判断 v m 都存在 才执行记录，不然浪费存储空间
        for (let i = 0; i < v.celldata.length; i++) {
            const item = v.celldata[i];
            // {"r":7,"c":6,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1}}
            // {"r":10,"c":9,"v":{"ct":{"fa":"General"},"bg":"#FFFF00","fs":11,"fc":"#FF0000","ff":"宋体","vt":0,"tb":1,"v":"123"}}
            // 不然创建新的 celldata 记录
            const newCellDataItem: CellDataModelType = {
                worker_sheet_id: v.index,
                r: item.r,
                c: item.c,
                v: <string>item.v.v || "",
                m: <string>item.v.v || "",
                ctfa: item.v?.ct?.fa || "General",
                ctt: item.v?.ct?.t || "g",
                bg: item.v.bg || "",
                fc: item.v.fc || "",
                bl: Boolean(item.v.bl),
                cl: Boolean(item.v.cl),
                ht: item.v.ht || 0,
                vt: item.v.vt || 0,
                f: item.v.f || "",
                un: Boolean(item.v.un),
                ps: <string>item.v.ps?.value,
            };

            // 执行插入操作
            await CellDataService.createCellData(newCellDataItem);
        }
    }

    if (v.config?.borderInfo) {
        for (let i = 0; i < v.config.borderInfo.length; i++) {
            const item = v.config.borderInfo[i];
            /**
             * 创建 borderinfo
             * {
             * 	"row_index":7,
             * 	"col_index":6,
             * 	"l":{"style":1,"color":"#000000"},
             * 	"r":{"style":1,"color":"#000000"},
             * 	"t":{"style":1,"color":"#000000"},
             * 	"b":{"style":1,"color":"#000000"}
             * }
             */
            // 判断当前 border 的类型
            if (item.rangeType === "cell") {
                const newBorderInfo: BorderInfoModelType = {
                    worker_sheet_id: v.index,
                    rangeType: item.rangeType,
                    row_index: item.value?.row_index,
                    col_index: item.value?.col_index,
                    l_style: item.value?.l?.style,
                    l_color: item.value?.l?.color,
                    t_style: item.value?.t?.style,
                    t_color: item.value?.t?.color,
                    r_style: item.value?.r?.style,
                    r_color: item.value?.r?.color,
                    b_style: item.value?.b?.style,
                    b_color: item.value?.b?.color,
                };
                await BorderInfoService.createConfigBorder(newBorderInfo);
            } else if (item.rangeType === "range") {
                console.log(" ==> ", item);
            }
        }
    }

    if (v.config?.merge) {
        await MergeService.deleteMerge(v.index);
        for (const key in v.config.merge) {
            if (Object.prototype.hasOwnProperty.call(v.config.merge, key)) {
                const { r, c, rs, cs } = v.config.merge[key];
                await MergeService.createMerge({ worker_sheet_id: v.index, r, c, rs, cs });
            }
        }
    }

    if (v.config?.colhidden) {
        for (const key in v.config.colhidden) {
            if (Object.prototype.hasOwnProperty.call(v.config.colhidden, key)) {
                await HiddenAndLenService.create({
                    worker_sheet_id: v.index,
                    config_type: "colhidden",
                    config_index: key,
                    config_value: 0,
                });
            }
        }
    }

    if (v.config?.columnlen) {
        for (const key in v.config.columnlen) {
            if (Object.prototype.hasOwnProperty.call(v.config.columnlen, key)) {
                const value = Number(v.config.columnlen[key]);
                await HiddenAndLenService.create({
                    worker_sheet_id: v.index,
                    config_type: "columnlen",
                    config_index: key,
                    config_value: value,
                });
            }
        }
    }

    if (v.config?.rowhidden) {
        for (const key in v.config.rowhidden) {
            if (Object.prototype.hasOwnProperty.call(v.config.rowhidden, key)) {
                await HiddenAndLenService.create({
                    worker_sheet_id: v.index,
                    config_type: "rowhidden",
                    config_index: key,
                    config_value: 0,
                });
            }
        }
    }

    if (v.config?.rowlen) {
        for (const key in v.config.rowlen) {
            if (Object.prototype.hasOwnProperty.call(v.config.rowlen, key)) {
                const value = Number(v.config.rowlen[key]);
                await HiddenAndLenService.create({
                    worker_sheet_id: v.index,
                    config_type: "rowlen",
                    config_index: key,
                    config_value: value,
                });
            }
        }
    }
}
