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
        newData = {}
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
            } else if (schema.properties[prop].type != "string" && newData[prop] === "") {
              // 如果该字段不是字符类型，但是前端传了空字符串过来，那就将这个字段移除，表示它未正确赋值。不然该字段无法通过类型校验，会报类型不是数值类型的错误
              delete newData[prop];
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
            // items正常为Object但也有可能是Array
            if (schema.items instanceof Array) {
              throw new Error("schema暂不支持设置array items为数组，若需要数组元素为多种类型，例如string、number、enum混用，请先在此之前自行实现逻辑判断，并在schema中移除items节点");
              // schema.items.forEach(schemaItem => {
              //   switch (schemaItem.type){
              //     case value:
              //       break;
              //     default:
              //       break;
              //   }
              //   // console.log(this.parseData({
              //   //   data: item,
              //   //   schema: schemaItem,
              //   //   name: `${name}[${index}]`
              //   // }))
              //   // typeof item === ""
              //   // schemaItem
              // });
            } else {
              return this.parseData({
                data: item,
                schema: schema.items,
                name: `${name}[${index}]`
              });
            }
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
