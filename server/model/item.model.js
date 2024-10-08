const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ItemSchema = new Schema({
  ItemCode: { type: String, required: true, unique: true },
  ItemName: { type: String, required: true },
  SAC_HSN_Code: String,
  ItemType: String,
  SerialNumber: String,
  IGST_Rate: Number,
  CGST_Rate: Number,
  SGST_Rate: Number,
  UTGST_Rate: Number
});

const Item = mongoose.model('Item', ItemSchema);
export default Item