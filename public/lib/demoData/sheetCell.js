window.sheetCell = {
	name: "Cell",
	index: "Sheet_6az6nei65t1i_1596209937084",
	order: "0",
	status: 1,
	celldata: [
		{ r: 0, c: 0, v: { v: "A", ct: { fa: "General", t: "n" }, m: "1" } },
		{ r: 0, c: 1, v: { v: "1", ct: { fa: "General", t: "n" }, m: "1" } },
		{ r: 1, c: 0, v: { v: "B", ct: { fa: "General", t: "n" }, m: "1" } },
		{ r: 1, c: 1, v: { v: "2", ct: { fa: "General", t: "n" }, m: "1" } },
		{ r: 4, c: 6, v: { v: "4-6", ct: { fa: "General", t: "n" }, m: "1" } },
	],
	// 自定义属性 - 单元格权限
	cellPermissions: [
		{ range: "A1:B2", permission: "readonly", userid: "1" }, // A1:B2 区域用户 1 只读
		{ range: "G5", permission: "readonly", userid: "1" }, // G5 单元格用户 1 只读
	],
};
