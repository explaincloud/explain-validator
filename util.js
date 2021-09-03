"use strict";

module.exports = class util {

	static parseData({
		data,
		schema,
		name
	}) {
		let newData;
		let type = schema.type;
		switch (type) {
			case "object":
				newData = {};
				if (data instanceof Object) {
					newData = data;
				} else {
					try {
						var _data = JSON.parse(data);
						if (_data instanceof Object) {
							newData = _data;
						}
					} catch (e) {
						throw new Error(`${name}不属于${type}类型，值为：${data}`);
					}
				}
				if (schema.properties) {
					for (var prop in schema.properties) {
						if (newData[prop]) {
							newData[prop] = this.parseData({
								data: newData[prop],
								schema: schema.properties[prop],
								name: `${name}.${prop}`
							});
						}
					}
				}
				break;
			case "array":
				newData = [];
				if (data instanceof Array) {
					newData = data;
				} else {
					try {
						var _data = JSON.parse(data);
						if (_data instanceof Array) {
							newData = _data;
						}
					} catch (e) {
						throw new Error(`${name}不属于${type}类型，值为：${data}`);
					}
				}
				if (schema.items) {
					newData = newData.map((item, index) => {
						return this.parseData({
							data: item,
							schema: schema.items,
							name: `${name}[${index}]`
						});
					});
				}
				break;
			case "string":
				if (typeof data === "string") {
					newData = data;
				} else {
					try {
						newData = data.toString();
					} catch (e) {
						throw new Error(`${name}不属于${type}类型，值为：${data}`);
					}
				}
				break;
			case "boolean":
				if (typeof data === "boolean") {
					newData = data;
				} else if (data == 0 || data == 1) {
					newData = !!data;
				} else if (data == "true") {
					newData = true;
				} else if (data == "false") {
					newData = false;
				} else {
					throw new Error(`${name}不属于${type}类型，值为：${data}`);
				}
				break;
			case "integer":
				newData = parseInt(data);
				if (isNaN(newData)) {
					throw new Error(`${name}不属于${type}类型，值为：${data}`);
				}
				break;
			case "number":
				newData = parseFloat(data);
				if (isNaN(newData)) {
					throw new Error(`${name}不属于${type}类型，值为：${data}`);
				}
				break;
			default:
				throw new Error(`${name}类型${type}不属于任何数据类型`);
				break;
		}
		return newData;
	}

	static translate(error) {
		// console.log(error)
		// let propertyName = "";
		let propertySchema = {};
		let propertyErrorMessage = "";
		let A = "";
		if (error.name === "required") {
			A = error.property.replace("instance", "").replace(/^./, "");
			if (A) {
				A = `${A}.${error.argument}`;
			} else {
				A = error.argument;
			}
			// propertyName = error.argument;
		} else {
			A = error.property.replace("instance", "").replace(/^./, "");
			// var B = error.path[error.path.length - 1];
			// if (typeof B === "number") {
			// 	propertyName = error.argument;
			// } else {
			// 	propertyName = B;
			// }
		}
		if (error.schema.properties) {
			propertySchema = error.schema.properties[error.argument];
		} else {
			propertySchema = error.schema;
		}
		if (propertySchema.display === undefined) {
			propertySchema.display = A;
		}
		if (propertySchema[`${error.name}ErrorMessage`]) {
			propertyErrorMessage = render(propertySchema[`${error.name}ErrorMessage`], propertySchema);
		} else {
			propertyErrorMessage = error.stack;
		}

		function render(template, data) {
			Object.keys(data).forEach(x => {
				template = template.replace(new RegExp(`{${x}}`, "g"), data[x]);
			});
			return template;
		}

		return propertyErrorMessage;
	}

}
