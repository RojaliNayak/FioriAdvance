/*global location */
/*global location */
sap.ui.define([
	"YRTV_ONE_TILE/YRTV_ONE_TILE/controller/CreateVerify/BaseController",
	"sap/ui/model/json/JSONModel",
	"YRTV_ONE_TILE/YRTV_ONE_TILE/model/CreateVerify/formatter",
	"sap/ui/core/Item",
	"sap/ui/model/Filter",
	"sap/m/MessageToast",
	"sap/ui/core/CustomData",
	"sap/ui/core/ValueState",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Text"
], function (BaseController, JSONModel, formatter, coreItem, Filter, MessageToast, CustomData, ValueState, Dialog, Button, Text) {
	"use strict";

	var __controller__;
	var __selectedDispositionActionCode__;

	var busy = function () {
		__controller__.getModel("detailView").setProperty("/busy", true);
	};

	var notBusy = function (promise) {
		if (promise) {
			$.when(promise).done(function () {
				__controller__.getModel("detailView").setProperty("/busy", false);
			});
		} else {
			__controller__.getModel("detailView").setProperty("/busy", false);
		}
	};

	var COLOR_MAPPING = {
		"1": {
			styleClass: "redLabel",
			placeholder: "Red"
		},
		"2": {
			styleClass: "yellowLabel",
			placeholder: "Yellow"
		},
		"3": {
			styleClass: "greenLabel",
			placeholder: "Green"
		},
		"4": {
			styleClass: "whiteLabel",
			placeholder: "White"
		}
	};

	var labelPlaceholder = function (labelColor) {
		return COLOR_MAPPING[labelColor] ? __controller__.getResourceBundle().getText(COLOR_MAPPING[labelColor].placeholder) : "";
	};

	var labelStyleClass = function (labelColor) {
		return COLOR_MAPPING[labelColor] ? COLOR_MAPPING[labelColor].styleClass : "";
	};

	return BaseController.extend("YRTV_ONE_TILE.YRTV_ONE_TILE.controller.CreateVerify.DetailBaseController", {
		formatter: formatter,
		StoreId: "",

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		onInit: function () {
			__controller__ = this;

			var oViewModel = new JSONModel({
				busy: false,
				delay: 0
			});

			this.setModel(oViewModel, "detailView");

			var visModel = new sap.ui.model.json.JSONModel({
				salesOrderVisible: false,
				salesOrderItemVisible: false,
				poTableVisible: false,
				articleItemCostNoPO: false,
				articleItemCostWithPO: true,
				enableOnlineRetailCheckBox: false,
				linkLabelVisible: false,
				redColor: "Red"
			});

			this.setModel(visModel, "controlVis");
			this.setModel(new JSONModel(), "vendorModel");
			this.setModel(new JSONModel(), "poModel");
			this.setModel(new JSONModel(), "pctJSONModel");

			this.getRouter().getRoute("createDetail").attachPatternMatched(this.onCreateDetailMatched, this);

			var LabelInputField = this.byId("LabelInputField");
			LabelInputField.addDelegate({
				onAfterRendering: function () {
					var labelObject = this.getBindingContext("articleModel").getObject(),
						labelColor = labelObject.LabelColor,
						labelNumber = labelObject.Value;

					this.removeStyleClass("redLabel").removeStyleClass("yellowLabel").removeStyleClass("greenLabel").removeStyleClass("whiteLabel");

					if (labelColor) {
						this.addStyleClass(labelStyleClass(labelColor));
					}

					if (!labelObject.Valid && !!labelNumber) {
						this.setValueState(ValueState.Error).focus();
						__controller__.onVKeypadHide();
					} else {
						this.setValueState(ValueState.None);
					}

					if (this.refreshDataState) {
						this.refreshDataState = $.noop;
					}

					$("#" + this.getId() + "-inner").attr('title', labelNumber);
				}
			}, false, LabelInputField, true);

			var ArticleQty = this.byId("ArticleQty");

			ArticleQty.addDelegate({
				onAfterRendering: function () {
					var articelObject = this.getBindingContext("articleModel").getObject();

					if (articelObject && !articelObject.Valid) {
						this.setValueState(ValueState.Error);
					} else {
						this.setValueState(ValueState.None);
					}

					this.setShowValueStateMessage(false);

					if (this.refreshDataState) {
						this.refreshDataState = $.noop;
					}

					__controller__.setFocusOnLoad = this;
				}
			}, false, ArticleQty, true);
		},

		onCreateDetailMatched: function (oEvent) {
			var oParameters = oEvent.getParameters();
			var article = oParameters.arguments.article;
			var reasonCode = oParameters.arguments.reasonCd;
			this.StoreId = oParameters.arguments.Werks;
			var that = this;

			if (oParameters.name === "createDetail") {
				__controller__.loadIsDone = $.Deferred();

				__controller__.loadIsDone.then(function () {
					if (__controller__.setFocusOnLoad) __controller__.setFocusOnLoad.focus();
				});

				jQuery.sap.require("jquery.sap.storage");
				var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
				var fromALU = oStorage.get("navBackFromALU");
				if (fromALU) {
					this.getArticleModel(article, reasonCode, oParameters);
				} else {
					this.addExtraModelProperties(this, oParameters);
				}

				var visModel = this.getModel("controlVis");
				visModel.setProperty("/linkLabelVisible", false);
			}

			this.byId('idCommentsFldCreate').setMaxLength(255);

			this.getOwnerComponent().googleAnalyticUpdate({
				page: "Create",
				site: this.StoreId
			}); //Google Analytics           
		},

		addExtraModelProperties: function (that, oParameters) {

			that.clearAllFlds();
			var articleModel = that.getModel("articleModel");
			var articleModelData = articleModel.getData();
			articleModelData.ReasonCode = oParameters.arguments.reasonCd;

			if (!Object.getOwnPropertyDescriptor(articleModelData, "CreateEnabled")) {
				Object.defineProperty(articleModelData, "CreateEnabled", {
					set: function () {},
					get: function () {
						if (this.Articles) {
							return !this.Articles.some(function (element, index, array) {
								var labelsValid = false;

								if (element.Labels && element.Labels.length > 0) {
									labelsValid = !element.Labels.some(function (labelElement, labelIndex, labelArray) {
										return !labelElement.Valid;
									});
								}

								if (this.getResonCodeProperty("ORIGIN_COD") == "COM" && element.MTART == "Z001" && this.ReasonCode === '31') {
									return !labelsValid;
								} else if (this.getResonCodeProperty("ORIGIN_COD") == "COM" && element.MTART == "Z003") {
									return !labelsValid;
								} else if (this.ReasonCode === '20' || this.ReasonCode === '30') {
									return !element.ItemQty || !labelsValid || !element.RGA || !element.NegotiatedCost || Number(element.ItemQty) === 0;
								} else if (this.ReasonCode === '06' || this.ReasonCode === '21') {
									return !element.ItemQty || !labelsValid || !element.RGA || !element.RGAValid || !this.PurchaseOrderNum || Number(element
										.ItemCost) === 0 || Number(element.ItemQty) === 0;
								} else {
									return !element.ItemQty || !labelsValid || Number(element.ItemCost) === 0 || Number(element.ItemQty) === 0;
								}
							}.bind(this));
						}
						return false;
					}
				});
			}

			if (!$.isFunction(articleModelData.getResonCodeProperty)) {
				articleModelData.getResonCodeProperty = function (propertyName) {
					var propertyValue;
					if (this.ReasonCodeSet) {
						this.ReasonCodeSet.some(function (element, index, array) {
							if (this.ReasonCode === element.REASON_CODE) {
								propertyValue = element[propertyName];
								return true;
							}
						}.bind(this));
					}
					return propertyValue;
				};
			}

			if (!Object.getOwnPropertyDescriptor(articleModelData, "OriginCode")) {
				Object.defineProperty(articleModelData, "OriginCode", {
					get: function () {
						return this.getResonCodeProperty("ORIGIN_COD");
					}
				});
			}

			if (!Object.getOwnPropertyDescriptor(articleModelData, "MaxLabels")) {
				Object.defineProperty(articleModelData, "MaxLabels", {
					get: function () {
						return this.getResonCodeProperty("MAX_LABEL");
					}
				});
			}

			if (!Object.getOwnPropertyDescriptor(articleModelData, "MultiLabel")) {
				Object.defineProperty(articleModelData, "MultiLabel", {
					get: function () {
						var hasDecimals = false;
						if (this.Articles) {
							hasDecimals = this.Articles.some(function (element, index, array) {
								return (element.ItemQty.indexOf(".") != -1 && parseInt(element.ItemQty.split(".")[1]) > 0);
							});
						}

						return this.getResonCodeProperty("MULTI_LABEL") === "X" && !hasDecimals;
					}
				});
			}

			if (!Object.getOwnPropertyDescriptor(articleModelData, "OnHandCheck")) {
				Object.defineProperty(articleModelData, "OnHandCheck", {
					get: function () {
						return this.getResonCodeProperty("ON_HAND_CHECK") === "X" ? true : false;
					}
				});
			}
			if (!Object.getOwnPropertyDescriptor(articleModelData, "MaxPriceCAD")) {
				Object.defineProperty(articleModelData, "MaxPriceCAD", {
					get: function () {
						return this.getResonCodeProperty("MAX_PRICE_CAD");
					}
				});
			}
			if (!Object.getOwnPropertyDescriptor(articleModelData, "MinPriceCAD")) {
				Object.defineProperty(articleModelData, "MinPriceCAD", {
					get: function () {
						return this.getResonCodeProperty("MIN_PRICE_CAD");
					}
				});
			}
			if (!Object.getOwnPropertyDescriptor(articleModelData, "MaxPriceUSD")) {
				Object.defineProperty(articleModelData, "MaxPriceUSD", {
					get: function () {
						return this.getResonCodeProperty("MAX_PRICE_USD");
					}
				});
			}
			if (!Object.getOwnPropertyDescriptor(articleModelData, "MinPriceUSD")) {
				Object.defineProperty(articleModelData, "MinPriceUSD", {
					get: function () {
						return this.getResonCodeProperty("MIN_PRICE_USD");
					}
				});
			}

			that.prevSelectedOriginCd = articleModelData.OriginCode;

			that.controlVis();
			that.setDefaultUoM();

			if (articleModelData.OriginCode === "MAN" && articleModelData.ReasonCode != '06' && articleModelData.ReasonCode != '21') {
				that.getVendors(true);
			} else {
				__controller__.loadIsDone.resolve();
			}
		},

		getArticleModel: function (article, reasonCode, oParameters) {
			var that = this,
				oModel = this.getModel(),
				aFilters = [
					new Filter("SEARCH_UPC_ART", "EQ", article),
					new Filter("WERKS", "EQ", this.StoreId),
					new Filter("TRANS", "EQ", "01")
				];

			oModel.read("/ArticleProcessSet", {
				filters: aFilters,
				async: false,
				urlParameters: {
					"$expand": "reason_cdset,upcset"
				},
				success: function (oData) {

					// setting additional details in articleModel
					for (var i = 0; i < oData.results.length; i++) {
						oData.results[i].Retail = "";
						oData.results[i].OnlineOnly = false;
						oData.results[i].RGA = "";
						oData.results[i].Attachment = "";
						oData.results[i].RtvLoc = "";
						oData.results[i].Comments = "";
						oData.results[i].Valid = true;
					}
					that.getModel().checkUpdate(true);
					that.createArticleModel({
						Articles: oData.results,
						ReasonCodeSet: oData.results[0].reason_cdset.results
					});

					that.addExtraModelProperties(that, oParameters);

				},
				error: function (oError) {

				}
			});

		},

		createArticleModel: function (data) {
			if (data) {
				this.getModel("articleModel").setData(data, true);
			} else {
				this.getModel("articleModel").setData({
					ReasonCode: "",
					Article: "",
					OrderNumber: "",
					PurchaseOrderNum: ""
				});
			}
		},

		controlVis: function () {
			var articleModel = this.getModel("articleModel");
			var visModel = this.getModel("controlVis");
			var originCode = articleModel.getProperty("/OriginCode");

			visModel.setProperty("/articleItemCostWithPO", true);
			visModel.setProperty("/articleItemCostNoPO", false);
			visModel.setProperty("/salesOrderItemVisible", false);

			if (originCode === "COM") {
				visModel.setProperty("/salesOrderVisible", true);
				visModel.setProperty("/addArticleSearch", false);
			} else {
				visModel.setProperty("/salesOrderVisible", false);
				visModel.setProperty("/addArticleSearch", true);
			}
		},

		setDefaultUoM: function () {
			var that = this;
			var articleModel = this.getModel("articleModel");
			var articleModelData = articleModel.getData();
			var sOriginCode = articleModelData.OriginCode;

			for (var i = 0; i < articleModelData.Articles.length; i++) {
				var article = articleModelData.Articles[i],
					upcset = article.upcset.results;

				if (upcset.length === 0) {
					sap.m.MessageBox.show(this.getResourceBundle().getText("UomIsMissingPleaseContactHelpdesk"), {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: that.getResourceBundle().getText("Error"),
						actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
						onClose: function (oAction) {
							if (oAction === sap.m.MessageBox.Action.YES) {
								that.getRouter().navTo("master", {}, true);
								that.clearAllFlds();
							}
						}
					});

					return;
				}

				var valueArr = {},
					uomArray = [];

				upcset.forEach(function (item) {
					valueArr[item.MEINH] = {
						"uom": item.MEINH,
						"upc": item.EAN11,
						"baseUoM": item.BUOM_FLAG,
						"MAX_DECIMAL": item.MAX_DECIMAL,
						"MEINH": item.MEINH
					};
				});

				Object.keys(valueArr).forEach(function (key, i) {
					uomArray.push(valueArr[key]);
				});

				article.UoMList = uomArray;
				article.ItemQty = "";
				article.Labels = [];

				if (sOriginCode === "COM") {
					article.UoMEnabled = false;
					article.QtyEnabled = false;

				} else if (articleModelData.ReasonCode === '06' || articleModelData.ReasonCode === '21') {
					article.UoMEnabled = false;
					article.QtyEnabled = false;
					article.RGAEnabled = false;
					article.RGAValid = false;
				} else {
					article.UoMEnabled = true;
					article.QtyEnabled = true;

					article.UoMList.some(function (element, index, array) {
						if (element.baseUoM === "X" || array.length == 1) {
							this.SelectedUoM = element.uom;
							return true;
						}
					}.bind(article));

					if (article.UoMList.length > 1 && !article.SelectedUoM) {
						sap.m.MessageBox.show(
							this.getResourceBundle().getText("UomIsMissingPleaseContactHelpdesk"), {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: that.getResourceBundle().getText("Error"),
								actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
								onClose: function (oAction) {
									if (oAction === sap.m.MessageBox.Action.YES) {
										that.getRouter().navTo("master", {}, true);
										that.clearAllFlds();
									}
								}
							});

						return;
					}
				}
			}

			articleModel.checkUpdate(true);
		},

		getVendors: function (shallCallPCT) {
			var articleTable = this.byId('idArticlesTable');
			var firstRow = articleTable.getItems()[0];
			var qtyFld = firstRow.getCells()[1];
			var qtyEntered = qtyFld.getValue();

			//Populating Vendor field items
			var vendorFld = this.byId("idVendorSelect");
			var vendorFldItem = new coreItem({
				text: {
					parts: [{
						path: 'vendorModel>LIFNR'
					}, {
						path: 'vendorModel>NAME1'
					}],
					formatter: formatter.vendorText
				},
				key: "{vendorModel>LIFNR}",
				customData: [
					new CustomData({
						key: "DC_FLAG",
						value: "{vendorModel>DC_FLAG}"
					}),
					new CustomData({
						key: "NETPR",
						value: "{vendorModel>NETPR}"
					}),
					new CustomData({
						key: "WAERS",
						value: "{vendorModel>WAERS}"
					})
				]
			});

			var that = this;
			var articleModel = this.getModel("articleModel");
			var articleModelData = articleModel.getData();
			var sOriginCode = articleModelData.OriginCode;

			var resCode = articleModelData.ReasonCode;
			var articleId = articleModelData.Articles[0].MATNR;
			var sOriginCode = articleModelData.OriginCode;
			var searchString = articleModelData.Articles[0].SEARCH_UPC_ART;
			var UPC = "";
			if (Number(searchString) !== Number(articleId) && sOriginCode !== "COM") {
				UPC = searchString;
			}

			var aFilters = [];
			if (sOriginCode === "COM") {
				this.getPOVendors();
			} else {
				this.getModel("controlVis").setProperty("/poTableVisible", false);
			}

			//getting default UoM
			var articleTable = this.byId('idArticlesTable');
			var selectedUoM = articleTable.getItems()[0].getCells()[2].getItems()[1].getSelectedKey();

			if (selectedUoM === null || selectedUoM === undefined || selectedUoM === "") {
				selectedUoM = articleTable.getItems()[0].getCells()[2].getItems()[0].getText();
			}

			aFilters.push(new Filter("WERKS", 'EQ', this.StoreId));
			aFilters.push(new Filter("MATNR", 'EQ', articleId));
			aFilters.push(new Filter("MEINH", 'EQ', selectedUoM));
			aFilters.push(new Filter("EAN11", 'EQ', UPC));

			vendorFld.bindItems({
				path: "vendorModel>/results",
				template: vendorFldItem
			});

			var oModel = this.getModel();
			var oView = this.getView();
			var that = this;
			var temp = [];

			busy();

			oModel.read("/INFO_RECORDSet", {
				filters: aFilters,
				success: function (oData) {
					notBusy();

					var vendorModel = oView.getModel("vendorModel");
					var vendorModelData = vendorModel.getData();

					if (sOriginCode === "COM") {

						if (vendorModelData.results === undefined || vendorModelData.results.length === 0) {
							vendorModel.setData(oData);
						} else {
							for (var articleVendorIdx = 0; articleVendorIdx < oData.results.length; articleVendorIdx++) {
								for (var poVendorIdx = 0; poVendorIdx < vendorModelData.results.length; poVendorIdx++) {
									if (vendorModelData.results[poVendorIdx].LIFNR !== oData.results[articleVendorIdx].LIFNR) {
										temp.push(oData.results[articleVendorIdx]);
									}
								}
							}
							if (temp.length !== 0) {
								for (var k = 0; k < temp.length; k++) {
									vendorModelData.results.push(temp[k]);
								}
							}
						}

						vendorModel.updateBindings(false);
					} else {
						if (oData.results && oData.results.length !== 0) {
							vendorModel.setData(oData);
						} else {
							sap.m.MessageBox.show(
								that.getResourceBundle().getText("VendorInformationIsMissingPleaseContactHelpdesk"), {
									icon: sap.m.MessageBox.Icon.ERROR,
									title: that.getResourceBundle().getText("Error"),
									actions: [sap.m.MessageBox.Action.OK],
									onClose: function (oAction) {
										that.getRouter().navTo("master", {}, true);
										that.clearAllFlds();
									}
								});
						}
					}

					vendorFld.rerender();
					that.removeVendors(vendorFld);
					//Populating Defective Allowance
					var deftAllw = that.byId("idDefctAllw");
					that.selectDefaultVendor(vendorFld, that);
					vendorFld.rerender();
					var oVendors = vendorModel.getData();
					var oLen = oVendors.results.length;
					var selectedVendor = vendorFld.getSelectedKey();
					var VENDOR;
					var oItemCostMissing;
					if (oLen === 1) {
						VENDOR = vendorFld.getSelectedItem().getBindingContext('vendorModel').getObject().VENDOR;
					} else {
						for (var i = 0; i < oLen; i++) {
							if (selectedVendor === oVendors.results[i].LIFNR) {
								VENDOR = oVendors.results[i].VENDOR;
								var oPrice = oVendors.results[i].NETPR;
								if (Number(oPrice) === 0) {
									oItemCostMissing = true;
								}
							}
						}
					}
					if (oItemCostMissing) {
						sap.m.MessageBox.show(
							that.getResourceBundle().getText("ItemCostIsMissingPleaseContactHelpdesk"), {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: that.getResourceBundle().getText("Error"),
								actions: [sap.m.MessageBox.Action.OK],
								onClose: function (oAction) {}
							});
					} else {
						var ItemCost, currency, hasItemCost;
						var selectedRow = articleTable.getItems()[0];
						var bindingContext = selectedRow.getBindingContext("articleModel");
						//Setting Item cost - incase of COM we are setting it from the selectedPOItem.
						that.updateItemCost(that);

						ItemCost = bindingContext.getObject().ItemCost;

						var __label__ = bindingContext.getObject();

						if (selectedVendor) {
							deftAllw.bindProperty("text", "DEF_ALLOW");
							deftAllw.bindObject("/DefectAllowanceSet(VENDOR='" + VENDOR + "',MATNR='" + articleId + "')");

							if (Number(ItemCost) === 0 || isNaN(Number(ItemCost))) {
								if (sOriginCode === "COM" && __label__.MTART === "Z001" && articleModelData.ReasonCode === '31') {
									that.callPCT();
									return;
								}
								if (sOriginCode === "COM" && __label__.MTART === "Z003") {
									that.callPCT();
									return;
								}
							}

							if (articleModelData.OnHandCheck && selectedVendor !== "" &&
								//changed Number(ItemCost) >= 0 from Number(ItemCost) > 0 for bug#139378607
								(Number(ItemCost) >= 0 && ItemCost !== undefined) &&
								selectedUoM !== "" && sOriginCode !== "" &&
								articleId !== "" && resCode !== "") {

								if (shallCallPCT && Number(ItemCost) > 0) {
									that.callPCT();
								} else {
									__controller__.loadIsDone.resolve();
								}

							} else if (!articleModelData.OnHandCheck && selectedVendor !== "" &&
								selectedUoM !== "" && sOriginCode !== "" &&
								articleId !== "" && resCode !== "") {

								that.callPCT();
							} else {
								__controller__.loadIsDone.resolve();

								that.getModel("detailView").setProperty("/busy", false);
							}
						}

						if (qtyEntered.length !== 0) {
							qtyFld.fireEvent("change");
						}
					}
				},
				error: function (oError) {
					notBusy();
					sap.m.MessageBox.show(
						JSON.parse(oError.responseText).error.message.value, {
							icon: sap.m.MessageBox.Icon.ERROR,
							title: that.getResourceBundle().getText("Error"),
							actions: [sap.m.MessageBox.Action.OK],
							onClose: function (oAction) {
								that.getRouter().navTo("master", {}, true);
							}
						});

				}
			});
		},

		updateItemCost: function (that) {
			var ItemCost, currency, hasItemCost;
			var articleTable = this.byId('idArticlesTable');
			var selectedRow = articleTable.getItems()[0];
			var bindingContext = selectedRow.getBindingContext("articleModel");
			var vendorFld = this.byId("idVendorSelect");
			var articleModel = this.getModel("articleModel");
			var articleModelData = articleModel.getData();
			var sOriginCode = articleModelData.OriginCode;

			ItemCost = vendorFld.getSelectedItem().getCustomData()[1].getValue();
			currency = vendorFld.getSelectedItem().getCustomData()[2].getValue();

			if (sOriginCode !== "COM") {
				articleModelData.Articles[0].ItemCost = ItemCost;
				articleModelData.Articles[0].ItemCostCurrency = currency;

				articleModel.checkUpdate(true);
			} else {
				/*Item cost will be popuated based on below conditions
				 * If PO cost is found, item cost is displayed and is not editable
				 * If PO cost is not found (article vendor cost), item cost will be populated or blank and is editable
				 *
				 * If chargeback reason code is selected, cost is populated if identified from PO and is editable as negotiated cost
				 * If chargeback reason code is selected and cost is not found (no PO), cost field is blank and editable as negotiated cost
				 */
				var poModel = that.getView().getModel("poModel");
				var noOfPOs = poModel.getData().POItemSet.results.length;
				if (noOfPOs > 1) {
					var poTable = that.getView().byId("idPOitemTable");
					var selectedPORow = poTable.getSelectedItem();
					that.showComItemCost(selectedPORow, "Multiple", that);
				} else if (noOfPOs === 1) {
					that.showComItemCost(poModel.getData().POItemSet.results[0], "Single", that);
				} else {

					articleModel.setProperty("DispCodeText", "", bindingContext);
					articleModel.setProperty("DISP_COD", "", bindingContext);
					articleModel.setProperty("LabelColor", "", bindingContext);
					articleModel.setProperty("AutoLabelNumber", "", bindingContext);
					articleModel.setProperty("Labels", [], bindingContext);
					articleModel.setProperty("propogateLabels", false, bindingContext);

					/* if ItemCost is not null then selected vendor is Article Vendor, so get the ItemCost from Vendor
					 * If ItemCost is null then selected vendor is PO vendor, so get the ItemCost from PO Item */

					if (ItemCost !== null) {
						articleModel.setProperty("ItemCost", ItemCost, bindingContext);
						articleModel.setProperty("ItemCostCurrency", currency, bindingContext);
						articleModel.setProperty("NegotiatedCost", ItemCost, bindingContext);
						articleModel.setProperty("NegotiatedCostCurrency", currency, bindingContext);
					} else {
						articleModel.setProperty("ItemCost", "0.00", bindingContext);
						articleModel.setProperty("ItemCostCurrency", "CAD", bindingContext);
						articleModel.setProperty("NegotiatedCost", "0.00", bindingContext);
						articleModel.setProperty("NegotiatedCostCurrency", currency, bindingContext);
					}
				}
				articleModel.checkUpdate(true);
			}

			ItemCost = articleModel.getProperty("/Articles/0/ItemCost");
			var __label__ = articleModel.getProperty("/Articles/0/");

			if (Number(ItemCost) === 0 || isNaN(Number(ItemCost))) {
				if (sOriginCode === "COM" && __label__.MTART === "Z001" && articleModelData.ReasonCode === '31') {
					return;
				}
				if (sOriginCode === "COM" && __label__.MTART === "Z003") {
					return;
				}

				sap.m.MessageBox.show(
					that.getResourceBundle().getText("ItemCostIsMissingPleaseContactHelpdesk"), {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: that.getResourceBundle().getText("Error"),
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function (oAction) {}
					});

				this.getModel("detailView").setProperty("/busy", false);
			}
		},

		selectDefaultVendor: function (vendorFld, that) {

			var selectedPOVendor, POItemRow;
			var articleModel = that.getView().getModel("articleModel");
			var sOriginCode = articleModel.getData().OriginCode;
			if (sOriginCode === "COM") {
				var poModel = that.getView().getModel("poModel");
				var poModelData = poModel.getData();
				var noOfPOs = poModelData.POItemSet.results.length;
				var poItemTable = that.getView().byId("idPOitemTable");

				if (noOfPOs > 1) {
					POItemRow = poItemTable.getSelectedItem();
					var selectedObj = POItemRow.getBindingContext("poModel").getObject();
					selectedPOVendor = selectedObj.LIFNR;
				} else if (noOfPOs === 1) {
					selectedPOVendor = poModelData.POItemSet.results[0].LIFNR;
				}
				vendorFld.setSelectedKey(selectedPOVendor);
			}
		},

		onNavBack: function () {
			var controlVisModel = this.getModel("controlVis");
			var that = this;
			var oDialog1;
			if (!this.oDialog1) {
				this.oDialog1 = new sap.m.Dialog({
					title: this.getResourceBundle().getText("Warning"),
					ariaDescribedBy: "p1",
					state: sap.ui.core.ValueState.Warning,
					content: [
						new sap.ui.core.HTML({
							content: '<p id="p1" style="margin:0; padding: 16px;">' + this.getResourceBundle().getText("AreYouSureYouWantToGoBack") +
								'</p>'
						})
					],
					buttons: [
						new sap.m.Button({
							text: this.getResourceBundle().getText("Yes"),
							press: function () {
								that.getRouter().navTo("master", {}, true);
								that.clearAllFlds();
								that.resetCOMFields();
								that.clearFldsOnOrderChange();
								controlVisModel.setProperty("/articleItemCostWithPO", false);

							}
						}),
						new sap.m.Button({
							text: this.getResourceBundle().getText("No"),
							press: function () {
								that.oDialog1.close();
							}
						})
					]
				});

				this.oDialog1.open();
			} else {
				this.oDialog1.open();
			}
		},

		removeVendors: function (vendorFld) {
			var rcDCFlag = this.byId("idReasonCodeSelect").getSelectedItem().getCustomData()[0].getValue();
			var vendorDCflag;
			for (var i = 0; i < vendorFld.getItems().length; i++) {
				vendorDCflag = vendorFld.getItems()[i].getCustomData()[0].getValue();
				if (rcDCFlag !== vendorDCflag) {
					vendorFld.getItems()[i].destroy();
					i--;
				}
			}

			//duplicate vendors
			for (var j = 0; j < vendorFld.getItems().length; j++) {
				for (var k = 0; k < vendorFld.getItems().length; k++) {
					if (j !== k && vendorFld.getItems()[j].getKey() === vendorFld.getItems()[k].getKey()) {
						vendorFld.getItems()[k].destroy();
						if (j > 0) {
							j--;
						}
						if (k > 0) {
							k--;
						}
					}
				}
			}

			vendorFld.rerender();
		},

		onColorCodeUpdate: function (oEvent) {
			var bindingContext = oEvent.getSource().getBindingContext("articleModel"),
				path = bindingContext.getPath(),
				path = path.substr(0, path.indexOf("/Labels")),
				articleModel = this.getModel("articleModel"),
				articleModelObject = this.getModel("articleModel").getProperty(path),
				uniqueLabels = {},
				labelFld = oEvent.getSource(),
				liveValue = labelFld.getValue();

			if (articleModelObject.propogateLabels) {
				var __labels__ = $.grep(articleModelObject.Labels, function (item) {
					return item.Value === liveValue;
				});

				if (__labels__) {
					if (__labels__.length > 1) {
						articleModel.setProperty("Valid", false, bindingContext);

						labelFld.getParent().rerender();
						sap.m.MessageToast.show(this.getResourceBundle().getText("ENTER_UNIQUE_LABELS"), {
							onClose: function () {
								labelFld.focus();
								__controller__.onVKeypadHide();
							}
						});
						labelFld.setValueStateText("").setValue("").focus();
						__controller__.onVKeypadHide();
						return;
					}
				}
			}

			var articleTable = this.byId('idArticlesTable');
			var firstRow = articleTable.getItems()[0];
			var qtyFld = firstRow.getCells()[1];
			var qtyEntered = qtyFld.getValue();

			if (Number(qtyEntered) !== 0) {
				if (liveValue.length === 17 && Number(qtyEntered) !== 0) {
					labelFld.setValue(liveValue);

					this.callColorCodeSearch(liveValue, oEvent);
				} else if (Number(qtyEntered) !== 0 && liveValue.length < 17) {
					articleModel.setProperty("Valid", false, bindingContext);
					labelFld.setValueStateText("").setValue("");
					sap.m.MessageToast.show(this.getResourceBundle().getText("PleaseEnter17DigitLabelNumber"), {
						onClose: function () {
							labelFld.focus();
							__controller__.onVKeypadHide();
						}
					});
				} else {
					articleModel.setProperty("Valid", false, bindingContext);
					labelFld.setValueStateText("");
					sap.m.MessageToast.show(this.getResourceBundle().getText("RTVQtyShouldBeGreaterThanZero"));
				}
			} else if (liveValue.length < 17) {
				articleModel.setProperty("Valid", false, bindingContext);
				labelFld.setValueStateText("").setValue("");
				sap.m.MessageToast.show(this.getResourceBundle().getText("PleaseEnter17DigitLabelNumber"), {
					onClose: function () {
						labelFld.focus();
						__controller__.onVKeypadHide();
					}
				});
			} else {
				if (liveValue.length === 17) {
					labelFld.setValue(liveValue);

					this.callColorCodeSearch(liveValue, oEvent);
				} else if (liveValue.length < 17) {
					articleModel.setProperty("Valid", false, bindingContext);
					labelFld.setValueStateText("").setValue("");
					sap.m.MessageToast.show(this.getResourceBundle().getText("PleaseEnter17DigitLabelNumber"), {
						onClose: function () {
							labelFld.focus();
							__controller__.onVKeypadHide();
						}
					});
				} else {
					articleModel.setProperty("Valid", false, bindingContext);
					labelFld.setValueStateText("");
					sap.m.MessageToast.show(this.getResourceBundle().getText("RTVQtyShouldBeGreaterThanZero"));
				}
			}

			labelFld.getParent().rerender();
		},

		callColorCodeSearch: function (labelNumber, oEvent) {
			busy();

			var bindingContext = oEvent.getSource().getBindingContext("articleModel"),
				labelField = oEvent.getSource(),
				articleModel = this.getModel("articleModel"),
				articleModelData = this.getModel("articleModel").getData(),
				sOriginCode = articleModelData.OriginCode,
				storeId = this.StoreId,
				originCode = sOriginCode;

			var path = bindingContext.getPath(),
				path = path.substr(0, path.indexOf("/Labels")),
				labelColor = this.getModel("articleModel").getProperty(path).LabelColor,
				matnr = this.getModel("articleModel").getProperty(path).MATNR;

			var REF_VBELN = "",
				REF_VBELP = "",
				COM_VBELN = "",
				COM_VBELP = "";

			if (originCode === "COM") {
				var poItemTable = this.byId("idPOitemTable");
				var poModel = poItemTable.getModel("poModel");
				var POItemSet = poModel.getData().POItemSet.results;
				var OrderItemSet = poModel.getData().OrderItemSet.results;

				var selectedPOI = poItemTable.getSelectedItem();

				if (POItemSet.length > 1 && selectedPOI && selectedPOI.getBindingContext("poModel")) {
					var selectedPOIPath = selectedPOI.getBindingContext("poModel").sPath;
					var selectedPOIdata = poModel.getObject(selectedPOIPath);
					REF_VBELN = selectedPOIdata.REF_VBELN;
					REF_VBELP = selectedPOIdata.REF_VBELP;
					for (var i = 0; i < OrderItemSet.length; i++) {
						if (REF_VBELN === OrderItemSet[i].REF_VBELN && REF_VBELP === OrderItemSet[i].REF_VBELP) {
							COM_VBELN = OrderItemSet[i].COM_VBELN;
							COM_VBELP = OrderItemSet[i].COM_VBELP;
							break;
						}
					}
				} else if (POItemSet.length === 1) {
					REF_VBELN = POItemSet[0].REF_VBELN;
					REF_VBELP = POItemSet[0].REF_VBELP;
					for (var j = 0; j < OrderItemSet.length; j++) {
						if (REF_VBELN === OrderItemSet[j].REF_VBELN && REF_VBELP === OrderItemSet[j].REF_VBELP) {
							COM_VBELN = OrderItemSet[j].COM_VBELN;
							COM_VBELP = OrderItemSet[j].COM_VBELP;
							break;
						}
					}

				} else if (POItemSet.length === 0) {
					var OrderItemFld = this.byId("idOrderItemFld");
					var orderItemKey = OrderItemFld.getSelectedKey();
					for (var k = 0; k < OrderItemSet.length; k++) {
						if (orderItemKey === OrderItemSet[k].COM_VBELP) {
							REF_VBELN = OrderItemSet[k].REF_VBELN;
							REF_VBELP = OrderItemSet[k].REF_VBELP;
							COM_VBELN = OrderItemSet[k].COM_VBELN;
							COM_VBELP = OrderItemSet[k].COM_VBELP;
							break;
						}
					}
				}
			}

			var aFilters = [
				new Filter("LABEL_NUMBER", "EQ", labelNumber),
				new Filter("MATNR", "EQ", matnr),
				new Filter("WERKS", "EQ", storeId),
				new Filter("LABEL_COLOR", "EQ", labelColor),
				new Filter("ORIGIN_CODE", "EQ", originCode),
				new Filter("COM_VBELN", "EQ", COM_VBELN),
				new Filter("COM_VBELP", "EQ", COM_VBELP),
				new Filter("REF_VBELP", "EQ", REF_VBELP),
				new Filter("REF_VBELN", "EQ", REF_VBELN),
				new Filter("REASON_CODE", "EQ", articleModelData.ReasonCode)
			];

			var that = this;
			var colorModel = this.getModel("colorModel");
			var onLabelModel = this.getModel();
			var articleTable = this.byId("idArticlesTable");
			var selectedRow = articleTable.getItems()[0];
			var qtyFld = selectedRow.getCells()[1];
			var dispositionFld = selectedRow.getCells()[7];

			onLabelModel.read("/LABEL_NUMSet", {
				filters: aFilters,
				success: function (oData) {
					notBusy();
					articleModel.setProperty("Valid", true, bindingContext);
					labelField.getParent().rerender();

					var __list = labelField.getParent().getParent(),
						currentIndex = __list.indexOfItem(labelField.getParent()),
						aItems = __list.getItems();

					if (aItems.length > (++currentIndex)) {
						var input = aItems[currentIndex].getContent()[0];
						input.$("inner").cursorPos(0);
						input.selectText(0, 0);
						input.focus();
					} else {
						//we reached the end of the list, for safety remove focus from label field to prevent double scanning
						labelField._$input.blur();
						jQuery.sap.delayedCall(500, that.byId("idCreateBtn"), that.byId("idCreateBtn").focus);
					}
				},
				error: function (oError) {
					notBusy();
					articleModel.setProperty("Valid", false, bindingContext);
					labelField.getParent().rerender();
					labelField.setValue("");
					MessageToast.show(JSON.parse(oError.responseText).error.message.value);
				}
			});
		},

		onRGAChange: function (evt) {
			var rgaFld = evt.getSource();
			var articleModel = rgaFld.getModel("articleModel");
			var articleModelData = articleModel.getData();
			if (articleModelData.ReasonCode === '06' || articleModelData.ReasonCode === '21') {
				var sVendor = this.getView().byId("idVendorSelect").getSelectedKey();
				var articleData = rgaFld.getBindingContext("articleModel").getObject();
				var sPath = "/Validate_Buyback_data";
				var oUrlParamters = {
					"LIFNR": "'" + sVendor + "'",
					"MATNR": "'" + articleData.MATNR + "'",
					"MEINS": "'" + articleData.SelectedUoM + "'",
					"MENGE": "'" + articleData.ItemQty + "'",
					"RETURNS_EBELN": "'" + articleModelData.PurchaseOrderNum + "'",
					"RGA_NUM": "'" + articleData.RGA + "'",
					"WERKS": "'" + articleData.WERKS + "'"
				};

				var oModel = this.getModel();
				var that = this;
				oModel.read(sPath, {
					urlParameters: oUrlParamters,
					success: function (oData) {
						articleData.RGAValid = true;
						rgaFld.setValueState("None");
						articleModel.checkUpdate(true);
					},
					error: function (oError) {
						articleData.RGAValid = false;
						rgaFld.setValueState("Error");
						articleModel.checkUpdate(true);
						sap.m.MessageBox.show(
							JSON.parse(oError.responseText).error.message.value, {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: that.getResourceBundle().getText("Error"),
								actions: [sap.m.MessageBox.Action.OK]
							});
					}
				});
			}
		},

		onPurchaseOrderChange: function (evt) {
			var POFld = evt.getSource();
			var enteredPO = POFld.getValue();
			var oModel = this.getModel();
			var sPath = "/Validate_Buyback_data";
			var articleModel = this.getModel("articleModel");
			var articleModelData = articleModel.getData();
			var sVendor = this.byId("idVendorSelect").getSelectedKey();
			var oUrlParamters = {
				"LIFNR": "'" + sVendor + "'",
				"MATNR": "'" + articleModelData.Articles[0].MATNR + "'",
				"MEINS": "'" + articleModelData.Articles[0].SelectedUoM + "'",
				"MENGE": "'" + articleModelData.Articles[0].ItemQty + "'",
				"RETURNS_EBELN": "'" + enteredPO + "'",
				"RGA_NUM": "'" + articleModelData.Articles[0].RGA + "'",
				"WERKS": "'" + articleModelData.Articles[0].WERKS + "'"
			};
			var that = this;
			oModel.read(sPath, {
				urlParameters: oUrlParamters,
				success: function (oData) {
					POFld.setValueState("None");
					that.onPOValidationSuccess(that, oData.Validate_Buyback_data);
				},
				error: function (oError) {
					POFld.setValueState("Error");
					that.clearFldsonErrorPONumber(that);
					sap.m.MessageBox.show(
						JSON.parse(oError.responseText).error.message.value, {
							icon: sap.m.MessageBox.Icon.ERROR,
							title: that.getResourceBundle().getText("Error"),
							actions: [sap.m.MessageBox.Action.OK]
						});
				}
			});
		},

		clearFldsonErrorPONumber: function (that) {
			var vendorModel = that.getModel("vendorModel");
			var articleModel = that.getModel("articleModel");
			var deftvAllwFld = this.getView().byId("idDefctAllw");
			deftvAllwFld.setText("");
			vendorModel.setData({});
			vendorModel.checkUpdate(true);
			articleModel.getData().Articles[0].ItemCost = "";
			articleModel.getData().Articles[0].Labels = [];
			articleModel.getData().Articles[0].RGA = "";
			articleModel.getData().Articles[0].RGAEnabled = false;
			articleModel.getData().Articles[0].RGAValid = false;
			articleModel.getData().UoMText = "";
			articleModel.checkUpdate(true);
		},

		onPOValidationSuccess: function (that, data) {
			var vendorFld = that.getView().byId("idVendorSelect");
			var articleModel = that.getModel("articleModel");
			var articleModelData = articleModel.getData();
			var firstArticleData = articleModelData.Articles[0];
			firstArticleData.SelectedUoM = data.MEINS;
			articleModelData.UoMText = data.MEINS;
			articleModelData.RETURNS_EBELP = data.RETURNS_EBELP;
			firstArticleData.RGAEnabled = true;

			articleModel.checkUpdate(true);
			that.getVendors(true);
			vendorFld.setSelectedKey(data.LIFNR);
			vendorFld.setEnabled(false);
		},

		onLiveChangeOfOrder: function (evt) {
			var fld = evt.getSource(),
				value = evt.getParameter("value").replace(/[^\d]/g, "");

			fld.updateDomValue(value);
			fld.setValueState(ValueState.None);
		},

		onLiveChangeOfLabel: function (evt) {
			var fld = evt.getSource(),
				// value = evt.getParameter("value").replace(/[^\d]/g, ""),
				value = "",
				articleModel = this.getModel("articleModel"),
				bindingContext = fld.getBindingContext("articleModel");
			value = evt.getParameters().value;
			fld.setValue(evt.getParameters().value);
			articleModel.setProperty("Valid", false, bindingContext);
			if (isNaN(value)) {
				var strAlpha = value.slice(0, -1);
				fld.setValue(strAlpha);
				return;
			}

			if (value !== "") {
				if (parseInt(value, 10).toString().length > 17) {
					fld.setValueState(sap.ui.core.ValueState.Error);
					fld.setValue(value.slice(0, -1));
					MessageToast.show(this.getResourceBundle().getText("PleaseEnter17DigitLabelNumber"));
					return;
				} else if (parseInt(value, 10).toString().length === 17) {
					articleModel.setProperty("Valid", true, bindingContext);
					fld.updateDomValue(value);
					fld.setValueState(sap.ui.core.ValueState.None);
					// this.onColorCodeUpdate(evt);
				} else if (parseInt(value, 10).toString().length < 17) {
					fld.updateDomValue(value);
					fld.setValueState(sap.ui.core.ValueState.None);
					// this.onColorCodeUpdate(evt);
				}
			}
			// else {
			// 	articleModel.setProperty("Valid", true, bindingContext);
			// 	fld.updateDomValue(value);
			// 	fld.setValueState(sap.ui.core.ValueState.None);
			// 	this.onColorCodeUpdate();
			// }
		},

		onReasonCodeChange: function () {
			__controller__.loadIsDone = $.Deferred();

			__controller__.loadIsDone.then(function () {
				if (__controller__.setFocusOnLoad) {
					jQuery.sap.delayedCall(500, __controller__.setFocusOnLoad, __controller__.setFocusOnLoad.focus);
				}
			});

			//Call function to control visibility of order related fields based on origin code (COM or non COM)
			var resCode = this.byId("idReasonCodeSelect").getSelectedKey();
			var vendorFld = this.byId("idVendorSelect");
			var vendorModel = vendorFld.getModel("vendorModel");
			var vendorFldItem = new coreItem({
				text: {
					parts: [{
						path: 'vendorModel>LIFNR'
					}, {
						path: 'vendorModel>NAME1'
					}],
					formatter: formatter.vendorText
				},
				key: "{vendorModel>LIFNR}",
				customData: [
					new sap.ui.core.CustomData({
						key: "DC_FLAG",
						value: "{vendorModel>DC_FLAG}"
					}),
					new CustomData({
						key: "NETPR",
						value: "{vendorModel>NETPR}"
					}),
					new CustomData({
						key: "WAERS",
						value: "{vendorModel>WAERS}"
					})
				]
			});

			vendorFld.bindItems({
				path: "vendorModel>/results",
				template: vendorFldItem
			});

			this.controlVis(resCode);
			this.removeVendors(vendorFld);
			var articleModel = this.getModel("articleModel");
			var articleModelData = articleModel.getData();
			var sOriginCode = articleModelData.OriginCode;

			if (!articleModelData.MultiLabel) {
				for (var i = 0; i < articleModelData.Articles.length; i++) {
					var article = articleModelData.Articles[i];

					article.Labels = article.Labels.slice(0, 1);
					article.propogateLabels = false;
				}

			}
			articleModelData.ReasonCode = resCode;
			articleModel.checkUpdate(true);

			if (this.prevSelectedOriginCd === "MAN" && sOriginCode === "MAN") { //Changing from MAN to MAN so just calling PCT
				this.clearFldsOnResCodeChange("MAN2MAN");
				if (articleModelData.ReasonCode !== '06' && articleModelData.ReasonCode !== '21' && vendorModel.getData().results) {
					this.callPCT();
				}
			} else if (this.prevSelectedOriginCd === "MAN" && sOriginCode === "COM") {
				this.clearFldsOnResCodeChange("MAN2COM");
			} else if (this.prevSelectedOriginCd === "COM" && sOriginCode === "MAN") {
				this.clearFldsOnResCodeChange("COM2MAN");
				this.getVendors();
			} else if (sOriginCode === "POS") {
				this.getVendors();
				this.callPCT();
			} else { //changing from COM to COM
				this.clearFldsOnResCodeChange("COM2COM");
				var OrderNumFld = this.byId("idOrderFld");
				if (OrderNumFld.getValue().length !== 0) {
					OrderNumFld.fireEvent("change");
				}
			}

			//incase Buyback/Safety recall
			if (sOriginCode === "MAN") {
				if (articleModelData.ReasonCode === '06' || articleModelData.ReasonCode === '21') {
					vendorFld.setEnabled(false);
					var deftvAllwFld = this.getView().byId("idDefctAllw");
					var vendorModel = vendorFld.getModel("vendorModel");
					vendorModel.setData({});
					deftvAllwFld.setText("");
					for (var articleIdx = 0; articleIdx < articleModelData.Articles.length; articleIdx++) {
						articleModelData.Articles[articleIdx].UoMEnabled = false;
						articleModelData.Articles[articleIdx].RGAEnabled = false;
						articleModelData.Articles[articleIdx].RGAValid = false;
						articleModelData.Articles[articleIdx].ItemCost = "";
					}
				} else {
					vendorFld.setEnabled(true);
					var vendorData = vendorFld.getModel("vendorModel").getData();
					if (!vendorData.results) {
						this.getVendors(true);
					}
					for (var articleIdx = 0; articleIdx < articleModelData.Articles.length; articleIdx++) {
						articleModelData.Articles[articleIdx].UoMEnabled = true;
					}
				}
			}
			articleModel.checkUpdate(true);

		},

		clearFldsOnResCodeChange: function (scenario) {
			var oView = this.getView();
			var orderFld = oView.byId("idOrderFld");
			var articleTable = oView.byId('idArticlesTable');
			var firstRow = articleTable.getItems()[0];
			var qtyFld = firstRow.getCells()[1];
			var uomFld = firstRow.getCells()[2];
			var currencyFld = firstRow.getCells()[4].getItems()[1];
			var dispCdFld = firstRow.getCells()[7];

			var poItemTable = oView.byId("idPOitemTable");
			var poModel = poItemTable.getModel("poModel");
			var vendorFld = oView.byId('idVendorSelect');
			var vendorModel = vendorFld.getModel("vendorModel");
			var articleModel = oView.getModel('articleModel');
			var deftvAllwFld = oView.byId("idDefctAllw");

			var controlVisModel = oView.getModel("controlVis");

			var bindingContext = firstRow.getBindingContext("articleModel"),
				articleModelObject = bindingContext.getObject();

			articleModelObject.Labels = [{
				Enabled: false,
				Value: "",
				LabelColor: "",
				Placeholder: ""
			}];

			if (scenario === "MAN2MAN") {
				articleModelObject.Labels[0].Enabled = true;
				articleModel.getData().Articles[0].DispCodeText = "";
				articleModel.getData().PurchaseOrderNum = "";
				articleModel.getData().Articles[0].RGA = "";
				articleModel.getData().Articles[0].RGAValid = false;
			} else if (scenario === "MAN2COM") {
				orderFld.setValue("");
				orderFld.setValueState(ValueState.None);
				qtyFld.setValue("");
				qtyFld.setValueState(ValueState.None);
				qtyFld.setEnabled(false);
				articleModel.getData().Articles[0].RGA = "";
				// uomFld.setSelectedKey(""); //need to update based on model
				// uomFld.setEnabled(false); // need to update based on model
				articleModel.getData().Articles[0].ItemCost = "";
				articleModel.getData().Articles[0].ItemCostCurrency = "CAD";

				articleModelObject.Labels[0].Enabled = false;

				articleModel.getData().Articles[0].DispCodeText = "";

				vendorModel.setData({});
				deftvAllwFld.setText("");
				vendorModel.checkUpdate(false);

			} else if (scenario === "COM2MAN") {
				qtyFld.setValue("");
				qtyFld.setValueState(ValueState.None);
				qtyFld.setEnabled(true);
				articleModel.getData().Articles[0].ItemCost = "";
				currencyFld.setSelectedKey("CAD");

				articleModelObject.Labels[0].Enabled = true;

				articleModel.getData().Articles[0].DispCodeText = "";
				articleModel.getData().Articles[0].RGA = "";
				vendorModel.setData({});
				deftvAllwFld.setText("");
				vendorModel.updateBindings(false);

				poModel.setData({});
				poItemTable.removeSelections();
				poModel.updateBindings(false);
				poItemTable.rerender();

				controlVisModel.setProperty("/articleItemCostNoPO", false);
				controlVisModel.setProperty("/articleItemCostWithPO", true);

				this.setMANdefaultUoM();

			} else {
				articleModel.getData().Articles[0].ItemCost = "";
				currencyFld.setSelectedKey("CAD");
				controlVisModel.setProperty("/articleItemCostNoPO", false);
				controlVisModel.setProperty("/articleItemCostWithPO", true);
				articleModel.getData().Articles[0].DispCodeText = "";
				articleModel.getData().Articles[0].RGA = "";
				vendorModel.setData({});
				deftvAllwFld.setText("");
				vendorFld.setSelectedKey("");
				vendorFld.rerender();
				vendorModel.updateBindings(false);
				poModel.setData({});
				poItemTable.removeSelections();
				poModel.updateBindings(false);
				poItemTable.rerender();
			}
			this.getModel("articleModel").checkUpdate(true);
		},

		resetCOMFields: function () {
			var oView = this.getView();
			var articleTable = oView.byId("idArticlesTable");
			var vendorFld = oView.byId('idVendorSelect');
			var deftvAllwFld = oView.byId("idDefctAllw");
			var articleModel = oView.getModel("articleModel");
			var dispTextFld = articleTable.getItems()[0].getCells()[7];

			vendorFld.unbindAggregation('items');
			deftvAllwFld.setText("");
			articleModel.getData().Articles[0].ItemCost = "";
			articleModel.getData().Articles[0].DispCodeText = "";
			articleModel.checkUpdate();
		},

		onVendorChange: function (evt) {
			__controller__.loadIsDone = $.Deferred();

			__controller__.loadIsDone.then(function () {
				if (__controller__.setFocusOnLoad) {
					jQuery.sap.delayedCall(500, __controller__.setFocusOnLoad, __controller__.setFocusOnLoad.focus);
				};
			});

			var vendorFld = evt.getSource();
			var articleModel = this.getModel("articleModel");
			var articleModelData = articleModel.getData();
			var articleId = articleModelData.Article;

			var deftAllw = this.byId("idDefctAllw");
			var VENDOR = vendorFld.getSelectedItem().getBindingContext('vendorModel').getObject().VENDOR;

			deftAllw.bindObject("/DefectAllowanceSet(VENDOR='" + VENDOR + "',MATNR='" + articleId + "')");
			deftAllw.bindProperty("text", "DEF_ALLOW");

			this.updateItemCost(this);

			articleModelData = articleModel.getData();
			var originCode = articleModelData.OriginCode,
				__label__ = articleModelData.Articles[0],
				itemCost = __label__.ItemCost;

			if (Number(itemCost) === 0 || isNaN(Number(itemCost))) {
				if (originCode === "COM" && __label__.MTART === "Z001" && articleModelData.ReasonCode === '31') {
					this.callPCT();
				}
				if (originCode === "COM" && __label__.MTART === "Z003") {
					this.callPCT();
				}
			} else {
				this.callPCT();
			}

			articleModel.checkUpdate();
		},

		onArticlesColumnPress: function (oEvent) {
			var source = oEvent.getSource(),
				bindingContext = source.getBindingContext("articleModel"),
				articleModelData = bindingContext.getObject();

			articleModelData.Retail = articleModelData.PRICE;

			if (Number(articleModelData.VTWEG) === 20) {
				articleModelData.OnlineOnly = false;
			} else if (Number(articleModelData.VTWEG) === 40) {
				articleModelData.OnlineOnly = true;
			}

			source.getModel("articleModel").checkUpdate(true);

			this.getOwnerComponent().googleAnalyticUpdate({
				page: "Create Additional Detail"
			}); //Google Analytics	

			this.getRouter().getTargets().display("articleDetail");

		},

		onQuantityLiveChange: function (evt) {
			var qtyFld = evt.getSource();
			var value = evt.getParameter("value");
			value = value.replace(/[^\d.]/g, "");

			var articleModel = this.getModel("articleModel"),
				bindingContext = qtyFld.getBindingContext("articleModel");

			articleModel.setProperty("Valid", true, bindingContext);

			var quantityDecimalLength = this.getDecimalData(qtyFld);
			var __split__ = value.split(".");

			if (value.indexOf(".") > -1) {
				if (quantityDecimalLength === 0) {
					value = __split__[0];
				} else if (__split__[1].length > quantityDecimalLength) {
					value = __split__[0] + "." + __split__[1].substring(0, quantityDecimalLength);
				} else if (__split__[1].length > 0) {
					if (parseInt(__split__[1]) > 0) {
						var bindingContext = qtyFld.getBindingContext("articleModel"),
							articleModel = this.getModel("articleModel"),
							articleModelData = articleModel.getData();

						if (articleModel.getProperty("propogateLabels", bindingContext)) {
							articleModel.setProperty("propogateLabels", false, bindingContext);
							this.propogateLabels(qtyFld);
						}
					}
					value = __split__[0] + "." + __split__[1];
				}
			}

			qtyFld.updateDomValue(value);
			qtyFld.setValueState(ValueState.None);
		},

		getDecimalData: function (fieldld) {
			var selectedRow = fieldld.getParent();
			var selectedUoM = selectedRow.getCells()[2].getItems()[1].getSelectedKey();
			var quantityDecimalLength = 0;
			var articleModel = this.getModel("articleModel");

			var UoMData = selectedRow.getBindingContext("articleModel").getObject().UoMList;

			for (var i = 0; i < UoMData.length; i++) {
				if (UoMData[i].MEINH === selectedUoM) {
					quantityDecimalLength = parseInt(UoMData[i].MAX_DECIMAL);
				}
			}
			return quantityDecimalLength;
		},

		onQtyChange: function (evt) {
			var qtyFld = evt.getSource();
			var qtyEntered = qtyFld.getValue();
			var selectedRow = qtyFld.getParent();
			var selectedUoM = selectedRow.getCells()[2].getItems()[1].getSelectedKey();

			var dispositionFld = selectedRow.getCells()[7];
			var articleModel = this.getModel("articleModel");
			var articleModelData = articleModel.getData(),
				bindingContext = qtyFld.getBindingContext("articleModel"),
				articleId = articleModel.getProperty("MATNR", bindingContext);

			if (Number(qtyEntered) > Number(articleModelData.MaxLabels)) {
				bindingContext.getObject().propogateLabels = false;
			}

			if (qtyEntered.length !== 0 && Number(qtyEntered) !== 0) {
				var originCode = articleModelData.OriginCode;
				var orderFld = this.byId("idOrderFld");

				var REF_VBELN = "",
					REF_VBELP = "",
					COM_VBELN = "",
					COM_VBELP = "";

				if (originCode === "COM") {
					if (originCode === "COM" && (orderFld.getValue().length === 0 || orderFld.getValueState() === "Error")) {
						orderFld.setValueState(ValueState.Error);
						return;
					}

					var poItemTable = this.byId("idPOitemTable");
					var poModel = poItemTable.getModel("poModel");
					var POItemSet = poModel.getData().POItemSet.results;
					var OrderItemSet = poModel.getData().OrderItemSet.results;

					var selectedPOI = poItemTable.getSelectedItem();

					if (POItemSet.length > 1 && selectedPOI && selectedPOI.getBindingContext("poModel")) {
						var selectedPOIPath = selectedPOI.getBindingContext("poModel").sPath;
						var selectedPOIdata = poModel.getObject(selectedPOIPath);
						REF_VBELN = selectedPOIdata.REF_VBELN;
						REF_VBELP = selectedPOIdata.REF_VBELP;
						for (var i = 0; i < OrderItemSet.length; i++) {
							if (REF_VBELN === OrderItemSet[i].REF_VBELN && REF_VBELP === OrderItemSet[i].REF_VBELP) {
								COM_VBELN = OrderItemSet[i].COM_VBELN;
								COM_VBELP = OrderItemSet[i].COM_VBELP;
								break;
							}
						}
					} else if (POItemSet.length === 1) {
						REF_VBELN = POItemSet[0].REF_VBELN;
						REF_VBELP = POItemSet[0].REF_VBELP;
						for (var j = 0; j < OrderItemSet.length; j++) {
							if (REF_VBELN === OrderItemSet[j].REF_VBELN && REF_VBELP === OrderItemSet[j].REF_VBELP) {
								COM_VBELN = OrderItemSet[j].COM_VBELN;
								COM_VBELP = OrderItemSet[j].COM_VBELP;
								break;
							}
						}

					} else if (POItemSet.length === 0) {
						var OrderItemFld = this.byId("idOrderItemFld");
						var orderItemKey = OrderItemFld.getSelectedKey();
						for (var k = 0; k < OrderItemSet.length; k++) {
							if (orderItemKey === OrderItemSet[k].COM_VBELP) {
								REF_VBELN = OrderItemSet[k].REF_VBELN;
								REF_VBELP = OrderItemSet[k].REF_VBELP;
								COM_VBELN = OrderItemSet[k].COM_VBELN;
								COM_VBELP = OrderItemSet[k].COM_VBELP;
								break;
							}
						}

					} else {
						MessageToast.show(this.getResourceBundle().getText("PleaseEnterOrderNumAndSelectPOItem"));
						return;
					}
				}

				var aFilters = [
					new Filter("MATNR", "EQ", articleId),
					new Filter("WERKS", "EQ", this.StoreId),
					new Filter("ORIGIN_COD", "EQ", originCode),
					new Filter("MEINS", "EQ", selectedUoM),
					new Filter("COM_VBELN", "EQ", COM_VBELN),
					new Filter("COM_VBELP", "EQ", COM_VBELP),
					new Filter("REF_VBELP", "EQ", REF_VBELP),
					new Filter("REF_VBELN", "EQ", REF_VBELN)
				];

				// var onHandQtyModel = this.getModel("onHandQtyModel");
				var onHandQtyModel = this.getGlobalModel();
				var that = this;

				if (Number(qtyEntered) !== 0) {
					if (articleModelData.OnHandCheck) {
						jQuery.sap.delayedCall(10, this, busy);
						var that = this;
						onHandQtyModel.read("/ON_HAND_QTY_GETSet", {
							filters: aFilters,
							success: function (odata) {
								notBusy();

								qtyFld.getCustomData()[0].setValue(odata.results[0].LGORT);

								if (Number(qtyEntered) > Number(odata.results[0].LABST)) {
									MessageToast.show(that.getResourceBundle().getText("onHand") + " " + Number(odata.results[0].LABST));
									articleModel.setProperty("Valid", false, bindingContext);
								} else {
									qtyFld.setValueState(ValueState.None);
									articleModel.setProperty("Valid", true, bindingContext);

									var LabelsTable;

									qtyFld.getParent().getCells().some(function (element) {
										if (element.getId().indexOf("LabelsTable") != -1) {
											LabelsTable = element;
											return true;
										} else {
											return false;
										}
									});

									if (LabelsTable) {
										var aItems = LabelsTable.getItems();
										if (aItems && aItems.length > 0) {
											aItems[0].getContent()[0].focus();
											__controller__.onVKeypadHide();
										}
									}
								}

								// qtyFld.rerender();
							},
							error: function (oError) {
								notBusy();

								if (oError.responseText.indexOf('{"') !== -1) {
									var oErrorJSON = JSON.parse(oError.responseText);

									sap.m.MessageBox.show(
										oErrorJSON.error.message.value, {
											icon: sap.m.MessageBox.Icon.ERROR,
											title: that.getResourceBundle().getText("Error"),
											actions: [sap.m.MessageBox.Action.OK]
										});
								} else {
									MessageToast.show(JSON.parse(oError.responseText).error.message.value);
								}

								qtyFld.rerender();
							}
						});
					}
				} else {
					notBusy();
					MessageToast.show(that.getResourceBundle().getText("RTVQtyShouldBeGreaterThanZero"));
					articleModel.setProperty("Valid", false, bindingContext);
				}
			} else if (Number(qtyEntered) === 0) {
				notBusy();
				MessageToast.show(this.getResourceBundle().getText("RTVQtyShouldBeGreaterThanZero"));
				articleModel.setProperty("Valid", false, bindingContext);
			} else {
				notBusy();
				articleModel.setProperty("Valid", false, bindingContext);
			}

			qtyFld.rerender();

			this.propogateLabels(qtyFld);
		},

		onUoMChange: function () {
			this.getVendors(true);
			var articleTable = this.byId("idArticlesTable");
			var qtyFld = articleTable.getItems()[0].getCells()[1];
			if (qtyFld.getValue() && qtyFld.getValue().length !== 0) {
				qtyFld.setValue('');
				qtyFld.fireEvent("change");
			}
		},

		onCurrencyChange: function () {
			this.callPCT();
		},

		callPCT: function (pctPromise) {
			pctPromise = !!pctPromise ? pctPromise : $.Deferred();

			var articleModel = this.getModel("articleModel");
			var articleTable = this.byId("idArticlesTable");
			var poItemTable = this.byId('idPOitemTable');
			var poModel = poItemTable.getModel('poModel');
			var poModelData = poModel.getData();
			var sItemCost;

			var articleModelData = articleModel.getData();
			var sOriginCode = articleModelData.OriginCode;
			var sResCode = articleModelData.ReasonCode;
			var articleId = articleModelData.Article;

			var selectedRow = articleTable.getItems()[0];

			var sSelectedUoM = selectedRow.getCells()[2].getItems()[1].getSelectedKey();
			var qtyFld = selectedRow.getCells()[1].getValue();
			var dispositionTxtCell = selectedRow.getCells()[7];
			var sUPC, CURRENCY;

			var uomArray = selectedRow.getBindingContext("articleModel").getObject().UoMList;

			for (var i = 0; i < uomArray.length; i++) {
				if (uomArray[i].uom === sSelectedUoM) {
					sUPC = uomArray[i].upc;
				}
			}

			if (sOriginCode === "COM") {
				if (poModelData.POItemSet && poModelData.POItemSet.results.length > 1) {
					if (poItemTable.getSelectedItem()) {
						sItemCost = (sResCode === '20' || sResCode === '30') ? articleModelData.Articles[0].NegotiatedCost : articleModelData.Articles[
								0]
							.ItemCost;
						CURRENCY = (sResCode === '20' || sResCode === '30') ? articleModelData.Articles[0].NegotiatedCostCurrency : articleModelData.Articles[
							0].ItemCostCurrency;
					} else {
						MessageToast.show(this.getResourceBundle().getText("PleaseselectPOItem"));
					}
				} else if (poModelData.POItemSet && poModelData.POItemSet.results.length === 1) {
					sItemCost = (sResCode === '20' || sResCode === '30') ? articleModelData.Articles[0].NegotiatedCost : articleModelData.Articles[
							0]
						.ItemCost;
					CURRENCY = (sResCode === '20' || sResCode === '30') ? articleModelData.Articles[0].NegotiatedCostCurrency : articleModelData.Articles[
						0].ItemCostCurrency;
				} else if (poModelData.POItemSet && poModelData.POItemSet.results.length === 0) {
					sItemCost = (sResCode === '20' || sResCode === '30') ? articleModelData.Articles[0].NegotiatedCost : articleModelData.Articles[
							0]
						.ItemCost;
					CURRENCY = (sResCode === '20' || sResCode === '30') ? articleModelData.Articles[0].NegotiatedCostCurrency : articleModelData.Articles[
						0].ItemCostCurrency;
				}
			} else {
				articleModel.checkUpdate();

				var itmCost1 = selectedRow.getCells()[3].getText().split("$")[0];
				var itmCost2 = selectedRow.getCells()[3].getText().split("$")[1];
				if (itmCost1 !== "") {
					sItemCost = itmCost1;
				} else {
					sItemCost = itmCost2;
				}
				CURRENCY = articleModelData.Articles[0].ItemCostCurrency;
			}

			var that = this;
			var articleModel = this.getModel("articleModel");
			var articleModelData = articleModel.getData();
			var sOriginCode = articleModelData.OriginCode;
			var bindingContext = selectedRow.getBindingContext("articleModel");

			var resCode = articleModelData.ReasonCode;
			var sOriginCode = articleModelData.OriginCode;

			var articleId = articleModel.getProperty("MATNR", bindingContext);

			var sDept = selectedRow.getBindingContext("articleModel").getObject().DEPT;
			var sClass = selectedRow.getBindingContext("articleModel").getObject().CLASS;
			var sSubClass = selectedRow.getBindingContext("articleModel").getObject().SUBCLASS;
			var sRtvType = selectedRow.getBindingContext("articleModel").getObject().RTV_TYPE;

			var orderFld = this.byId('idOrderFld');
			var vendorFld = this.byId("idVendorSelect");
			vendorFld.rerender();
			var defAllwFld = this.byId("idDefctAllw");

			var sVendor = vendorFld.getSelectedKey();

			var sRegio = 'ON';
			var sLand1 = 'CA';

			if (sVendor !== "" && sSelectedUoM !== "" &&
				sOriginCode !== "" && articleId !== "" && sResCode !== "") {
				//changed Number(sItemCost) < 0 from Number(sItemCost) <= 0 bug#139378607
				if (articleModelData.OnHandCheck && (Number(sItemCost) < 0 || sItemCost === undefined)) {
					return;
				}

				var aFilters = [
					new Filter("MATNR", "EQ", articleId),
					new Filter("WERKS", "EQ", this.StoreId),
					new Filter("ORIGIN_COD", "EQ", sOriginCode),
					new Filter("MEINH", "EQ", sSelectedUoM),
					new Filter("EAN11", "EQ", sUPC),
					new Filter("ITEM_COST", "EQ", Number(sItemCost)),
					new Filter("REASON_CODE", "EQ", sResCode),
					new Filter("LIFNR", "EQ", sVendor),
					new Filter("CLASS", "EQ", sClass),
					new Filter("SUBCLASS", "EQ", sSubClass),
					new Filter("LAND1", "EQ", sLand1),
					new Filter("REGIO", "EQ", sRegio),
					new Filter("DEPT", "EQ", sDept),
					new Filter("RTV_TYPE", "EQ", sRtvType),
					new Filter("CURRENCY", "EQ", CURRENCY)
				];

				var sDipositionTxt;
				var autoLabelNumber;
				var pctModel = this.getModel("oPCTModel");

				busy();

				articleModel.setProperty("Labels", [], bindingContext);
				articleModel.setProperty("propogateLabels", false, bindingContext);

				pctModel.read("/PCT_DETAILSet", {
					filters: aFilters,
					urlParameters: {
						"$expand": "DISP_ACT_CODESet,LABEL_NOSet"
					},
					success: function (oData) {
						notBusy();

						pctPromise.resolve();

						that.getModel('pctJSONModel').setData(oData);

						var labelColor = oData.results[0].LABEL_COLOR;
						sDipositionTxt = oData.results[0].DISP_COD_TXT;
						autoLabelNumber = oData.results[0].LABEL_NOSet.results[0].LABEL_NUM;

						articleModel.setProperty("DispCodeText", sDipositionTxt, bindingContext);
						articleModel.setProperty("DISP_COD", oData.results[0].DISP_COD, bindingContext);
						articleModel.setProperty("LabelColor", labelColor, bindingContext);
						articleModel.setProperty("AutoLabelNumber", autoLabelNumber, bindingContext);

						articleModel.setProperty("Labels", $.map(oData.results[0].LABEL_NOSet.results, function (item) {
							return {
								Enabled: !autoLabelNumber,
								Value: item.LABEL_NUM,
								LabelColor: labelColor,
								Placeholder: labelPlaceholder(labelColor),
								Valid: !!autoLabelNumber
							};
						}), bindingContext);

						articleModel.getData().Articles[0].QtyEnabled = true;
						var oMTART = articleModel.getData().Articles[0].MTART;
						articleModel.checkUpdate(true);
						that.getModel("dispositionActionCodesModel").setData(oData.results[0].DISP_ACT_CODESet.results);
						// if (oMTART !== "Z003") {
						var dispositionActionArray = that.getModel("dispositionActionCodesModel").getData();
						that.showDialog(dispositionActionArray, that, that, oMTART);
						// }
						__controller__.loadIsDone.resolve();
					},
					error: function (oError) {
						notBusy();

						pctPromise.resolve();

						articleModel.getData().Articles[0].DispCodeText = "";
						articleModel.getData().Articles[0].DISP_COD = "";
						articleModel.getData().Articles[0].QtyEnabled = false;
						articleModel.checkUpdate(true);

						if (oError.responseText.indexOf('{"') !== -1) {
							var oErrorJSON = JSON.parse(oError.responseText);
							sap.m.MessageBox.show(
								oErrorJSON.error.message.value, {
									icon: sap.m.MessageBox.Icon.ERROR,
									title: that.getResourceBundle().getText("Error"),
									actions: [sap.m.MessageBox.Action.OK]
								});

						} else if (oError.responseText.indexOf("<html>") === 0) {
							sap.m.MessageBox.show(
								oError.responseText, {
									icon: sap.m.MessageBox.Icon.ERROR,
									title: that.getResourceBundle().getText("Error"),
									actions: [sap.m.MessageBox.Action.OK]
								});
						} else {
							sap.m.MessageBox.show(
								JSON.parse(oError.responseText).error.message.value, {
									icon: sap.m.MessageBox.Icon.ERROR,
									title: that.getResourceBundle().getText("Error"),
									actions: [sap.m.MessageBox.Action.OK]
								});
						}
					}
				});
			}
		},

		onGoPress: function () {
			var dispositionActionCodesModel = this.getModel("dispositionActionCodesModel");
			var dispositionActionArray = dispositionActionCodesModel.getData();
			if (dispositionActionArray.length === 0) {
				this.onVerifyPress(null);
			} else if ((dispositionActionArray.length === 1) || (dispositionActionArray.length > 1)) {
				this.validateOHQuantity(dispositionActionArray, this);
			}
		},

		validateOHQuantity: function (dispositionActionArray, controllerRef) {
			var articleTable = this.byId("idArticlesTable");
			var firstRow = articleTable.getItems()[0];
			var qtyFld = firstRow.getCells()[1];
			var qtyEntered = qtyFld.getValue();

			//Get all parameter values and then call OH service
			var articleModel = this.getModel("articleModel");
			var articleModelData = articleModel.getData();
			var originCode = articleModelData.OriginCode;

			var selectedUoM = firstRow.getCells()[2].getItems()[1].getSelectedKey();

			/***********************COM logic starts*********************************************/
			var REF_VBELN = "",
				REF_VBELP = "",
				COM_VBELN = "",
				COM_VBELP = "";

			if (originCode === "COM") {
				var poItemTable = this.byId("idPOitemTable");
				var poModel = poItemTable.getModel("poModel");
				var POItemSet = poModel.getData().POItemSet.results;
				var OrderItemSet = poModel.getData().OrderItemSet.results;

				var selectedPOI = poItemTable.getSelectedItem();

				if (POItemSet.length > 1 && selectedPOI && selectedPOI.getBindingContext("poModel")) {
					var selectedPOIPath = selectedPOI.getBindingContext("poModel").sPath;
					var selectedPOIdata = poModel.getObject(selectedPOIPath);
					REF_VBELN = selectedPOIdata.REF_VBELN;
					REF_VBELP = selectedPOIdata.REF_VBELP;
					for (var i = 0; i < OrderItemSet.length; i++) {
						if (REF_VBELN === OrderItemSet[i].REF_VBELN && REF_VBELP === OrderItemSet[i].REF_VBELP) {
							COM_VBELN = OrderItemSet[i].COM_VBELN;
							COM_VBELP = OrderItemSet[i].COM_VBELP;
							break;
						}
					}
				} else if (POItemSet.length === 1) {
					REF_VBELN = POItemSet[0].REF_VBELN;
					REF_VBELP = POItemSet[0].REF_VBELP;
					for (var j = 0; j < OrderItemSet.length; j++) {
						if (REF_VBELN === OrderItemSet[j].REF_VBELN && REF_VBELP === OrderItemSet[j].REF_VBELP) {
							COM_VBELN = OrderItemSet[j].COM_VBELN;
							COM_VBELP = OrderItemSet[j].COM_VBELP;
							break;
						}
					}

				} else if (POItemSet.length === 0) {
					var OrderItemFld = this.byId("idOrderItemFld");
					var orderItemKey = OrderItemFld.getSelectedKey();
					for (var k = 0; k < OrderItemSet.length; k++) {
						if (orderItemKey === OrderItemSet[k].COM_VBELP) {
							REF_VBELN = OrderItemSet[k].REF_VBELN;
							REF_VBELP = OrderItemSet[k].REF_VBELP;
							COM_VBELN = OrderItemSet[k].COM_VBELN;
							COM_VBELP = OrderItemSet[k].COM_VBELP;
							break;
						}
					}

				} else {
					MessageToast.show(this.getResourceBundle().getText("PleaseEnterOrderNumAndSelectPOItem"));
					return;
				}
			}
			/***********************COM logic ends*********************************************/
			var articleModel = this.getModel("articleModel"),
				articleModelData = articleModel.getData(),
				bindingContext = firstRow.getBindingContext("articleModel"),
				articleId = articleModel.getProperty("MATNR", bindingContext),
				reasonCode = articleModelData.ReasonCode,
				originCode = articleModelData.OriginCode,
				rgaUpperCase = articleModelData.Articles[0].RGA.toUpperCase();

			var aFilters = [

				new Filter("MATNR", "EQ", articleId),
				new Filter("WERKS", "EQ", this.StoreId),
				new Filter("ORIGIN_COD", "EQ", originCode),
				new Filter("MEINS", "EQ", selectedUoM),
				new Filter("COM_VBELN", "EQ", COM_VBELN),
				new Filter("COM_VBELP", "EQ", COM_VBELP),
				new Filter("REF_VBELP", "EQ", REF_VBELP),
				new Filter("REF_VBELN", "EQ", REF_VBELN)
			];
			var that = this;
			var onHandQtyModel = this.getModel();
			var selectedRow = qtyFld.getParent(),
				createBtn = this.byId("idCreateBtn");
			var oMTART = articleModel.getData().Articles[0].MTART;

			// if (true) //(labelEntered.length === 17 && labelColorFld.getValueState() !== "Error" )
			// {
			// onHandQtyModel.read("/ON_HAND_QTY_GETSet", {
			// 	filters: aFilters,
			// 	success: function (odata) {
			// 		if (Number(qtyEntered) > Number(odata.results[0].LABST)) {
			// 			// if (true) //if (labelEntered.length === 17)
			// 			// {
			// 			createBtn.setEnabled(false);
			// 			sap.m.MessageBox.show(
			// 				that.getResourceBundle().getText("NotEnoughOnHandQuantityForArticle") + ":" + odata.results[0].MATNR + "," + that.getResourceBundle()
			// 				.getText("Site") + ":" + odata.results[0].WERKS + " - " + that.getResourceBundle().getText("AvailableQty") + ":" + odata.results[
			// 					0].LABST, {
			// 					icon: sap.m.MessageBox.Icon.ERROR,
			// 					title: that.getResourceBundle().getText("Error"),
			// 					actions: [sap.m.MessageBox.Action.OK],
			// 					onClose: function (oAction) {
			// 						// if (oAction === sap.m.MessageBox.Action.OK) {}
			// 					}
			// 				});

			// 			// } else if (false) //(labelEntered.length !== 17 || labelColorFld.getValueState() === "Error" || labelEntered === "") //
			// 			// {
			// 			//     sap.m.MessageBox.show(
			// 			//         that.getResourceBundle().getText("NotEnoughOnHandQuantityForArticle") + ":" + odata.results[0].MATNR + "," + that.getResourceBundle()
			// 			//             .getText("Site") + ":" + odata.results[0].WERKS + " - " + that.getResourceBundle().getText("AvailableQty") + ":" + odata.results[
			// 			//             0].LABST, {
			// 			//             icon: sap.m.MessageBox.Icon.ERROR,
			// 			//             title: that.getResourceBundle().getText("Error"),
			// 			//             actions: [sap.m.MessageBox.Action.OK],
			// 			//             onClose: function(oAction) {
			// 			//                 if (oAction === sap.m.MessageBox.Action.OK) {
			// 			//                     // that.getRouter().navTo("master", {}, true);
			// 			//                     // that.clearAllFlds();
			// 			//                 }
			// 			//             }
			// 			//         });

			// 			// }
			// } else if (reasonCode === "14" && originCode === "COM" && (rgaUpperCase.startsWith("LL") || rgaUpperCase.startsWith("SS"))) {
			if (reasonCode === "14" && originCode === "COM" && (rgaUpperCase.startsWith("LL") || rgaUpperCase.startsWith("SS"))) { //nxm1ysc
				that.onVerifyPress(null);
			} else {
				// this.showDialog(dispositionActionArray, controllerRef, that, oMTART)
				that.onVerifyPress(__selectedDispositionActionCode__);
			} //nxm1ysc

		},

		showInfoDialog: function (dispositionActionArray, controllerReference) {
			//Create dialog
			var that = this;

			sap.m.MessageBox.show(
				that.getResourceBundle().getText("SystemHasDeterminedThisItemToBeScrappedDueToHDVendorPolicies"), {
					icon: sap.m.MessageBox.Icon.INFORMATION,
					title: this.getResourceBundle().getText("Information"),
					actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
					onClose: function (oAction) {
						if (oAction === sap.m.MessageBox.Action.OK) {
							controllerReference.onVerifyPress(dispositionActionArray[0].DISP_ACT_COD);
						}
					}
				});
		},

		showDialog: function (dispositionActionArray, controllerReference, that, oMTART) {

			var selectedDispActionCode;
			var radioButtonCodeArray = [];
			var radioButtonTextArray = [];
			var radioButtonsArray = [];
			var length = dispositionActionArray.length;
			var oMessage;
			if (oMTART === "Z001") {
				oMessage = this.getResourceBundle().getText("ReturnToFloorZ001");
			} else {
				oMessage = this.getResourceBundle().getText("ReturnToFloorZ003");
			}
            
            var sDispCodeText = this.getModel('articleModel').oData.Articles[0].DispCodeText;
			//Create dialog
			var standardDialog = new sap.m.Dialog({
				content: [
					new sap.ui.core.HTML({
						content: '<p id="p2" style="margin:0; text-align: center;">' + sDispCodeText +
							'</p>'
					})
				],
				title: that.getResourceBundle().getText("SelectDispositionAction"),
				type: "Message",
				leftButton: new sap.m.Button({
					text: that.getResourceBundle().getText("Submit"),
					//Event handler for Submit button
					press: function () {

						for (var j = 0; j < radioButtonsArray.length; j++) {
							if (radioButtonsArray[j].getSelected()) {
								// selectedDispActionCode = radioButtonCodeArray[j];
								__selectedDispositionActionCode__ = null;
								if (radioButtonCodeArray[j] === "01") {
									if (oMTART === "Z001") {
										that.clearAllFlds("RTF");
										that.getRouter().navTo("master", {}, true);
										MessageToast.show(oMessage, {
											duration: 2000,
											closeOnBrowserNavigation: false
										});
									} else if (oMTART === "Z003") {
										// that.onVerifyPress(radioButtonCodeArray[j]);
										// that.moveInventorytoFLoor();
										__selectedDispositionActionCode__ = radioButtonCodeArray[j];
									}
								} else {
									__selectedDispositionActionCode__ = radioButtonCodeArray[j];
								}
							}
						}
						standardDialog.close();
					}
				}),

				rightButton: new sap.m.Button({
					text: that.getResourceBundle().getText("Cancel"),
					//Event handler for Cancel button
					press: function () {
						standardDialog.close();
						that.clearAllFlds("RTF");
						that.getRouter().navTo("master", {}, true);
					}
				})
			});

			//Create Radio buttons based on number of disposition action codes in model
			for (var i = 0; i < length; i++) {
				radioButtonCodeArray.push(dispositionActionArray[i].DISP_ACT_COD);
				switch (dispositionActionArray[i].DISP_ACT_COD) {
				case "01":
					if (oMTART === "Z001") {
						radioButtonTextArray.push(that.getResourceBundle().getText("Z001_RETURN"));
					} else {
						if (oMTART === "Z003") {
							radioButtonTextArray.push(that.getResourceBundle().getText("Z003_RETURN"));
						} else radioButtonTextArray.push(dispositionActionArray[i].DISP_ACT_COD_TXT);
					}
					break;
				case "02":
					if (oMTART === "Z001" || oMTART === "Z003") {
						radioButtonTextArray.push(that.getResourceBundle().getText("SCRAP"));
					} else radioButtonTextArray.push(dispositionActionArray[i].DISP_ACT_COD_TXT);
					break;
				default:
					radioButtonTextArray.push(dispositionActionArray[i].DISP_ACT_COD_TXT);
				}

				radioButtonsArray[i] = new sap.m.RadioButton({
					text: radioButtonTextArray[i]
				});
				//add radio buttons to dialog box.
				standardDialog.addContent(radioButtonsArray[i]);
			}
			//Set the first radio button as selected when the dialog shows up.
			radioButtonsArray[0].setSelected(true);
			//Open the dialog box.
			standardDialog.open();
			//To do destroy/cleanup dialog in reset

		},
		//// Move STock to floor for Z003
		// moveInventorytoFLoor: function () {
		// 	var oModel = this.getModel();
		// 	var articleModel = this.getModel("articleModel");
		// 	var oData = articleModel.getData().Articles[0];
		// 	var oOrderData = articleModel.getData().OrderNumber;
		// 	var oMessage = this.getResourceBundle().getText("ReturnToFloorZ003");
		// 	var oErrorMessage = this.getResourceBundle().getText("ErrorReturnToFloorZ003");
		// 	var that = this;

		// 	if (oData) {
		// 		var payload = {
		// 			"WERKS": oData.WERKS,
		// 			"MATNR": oData.MATNR,
		// 			"MENGE": "1",
		// 			"MEINS": "EA",
		// 			"ORIGIN_COD": "COM",
		// 			"DISP_COD": oData.DISP_COD,
		// 			"COM_VBELN": oOrderData,
		// 			"MTART": oData.MTART
		// 		}

		// 		oModel.post("StockTransferSet",
		// 			payload, {
		// 				success: function (odata, response) {
		// 					MessageToast.show(oMessage, {
		// 						duration: 5000
		// 					});
		// 				},
		// 				error: function (oError, resp1, resp2) {
		// 					MessageToast.show(oErrorMessage, {
		// 						duration: 5000
		// 					});

		// 				}
		// 			});
		// 	}

		// },

		onCreatePress: function () {
			//Need to add code for create press
			if (this._oDialog) {
				this._oDialog.close();
			}
		},

		onCancelPress: function () {
			// close the dialog
			if (this._oDialog) {
				this._oDialog.close();
			}
		},

		onDispositionSelectionChange: function (evt) {
			var oSelectedRow = evt.getParameters('selected').listItem;
			var dispCode = oSelectedRow.getCells()[2].getText();
			// console.log(dispCode);
		},

		removeStyleClass: function (labelNumberFld) {
			labelNumberFld.removeStyleClass('redLabel').removeStyleClass('yellowLabel').removeStyleClass('greenLabel').removeStyleClass(
					'whiteLabel')
				.setValue("").setValueState(ValueState.None).setPlaceholder("");
		},

		clearAllFlds: function (value) {
			//clear all fields
			var oView = this.getView();
			var reasonCode = oView.byId("idReasonCodeSelect");
			var orderFld = oView.byId("idOrderFld");
			var orderItemFld = oView.byId("idOrderItemFld");
			var vendorFld = oView.byId("idVendorSelect");
			var POnumberFld = oView.byId("idPurchaseOrderNum");
			var articleModel = oView.getModel("articleModel");
			var articleModelData = articleModel.getData();
			var vendorModel = vendorFld.getModel('vendorModel');
			var poModel = oView.getModel('poModel');
			var DefectiveAllow = oView.byId("idDefctAllw");
			var poitemTable = oView.byId("idPOitemTable");
			var articleTable = oView.byId("idArticlesTable");
			DefectiveAllow.unbindText();

			if (!value) {
				articleModelData.Articles[0].ItemCost = "";
				articleModelData.Articles[0].ItemQty = "";
				articleModelData.Articles[0].SelectedUoM = "";
			}
			reasonCode.clearSelection();
			orderFld.setValue("");
			orderFld.setValueState(ValueState.None);
			orderFld.setValueStateText("");
			POnumberFld.setValueState("None");
			orderItemFld.clearSelection();
			orderItemFld.destroyItems();
			vendorModel.setData({});
			vendorModel.updateBindings(false);
			vendorFld.clearSelection();

			articleModelData.Articles[0].DispCodeText = "";
			articleModelData.Articles[0].DISP_COD = "";

			poitemTable.setSelectedContextPaths([]);
			poitemTable.rerender();

			poModel.setData({});

			this.getModel("controlVis").setProperty("/poTableVisible", false);
			vendorFld.rerender();
		},

		onOrderChange: function (evt) {
			if (this.orderChangeValidation(evt)) {
				var oOrderFld = evt.getSource();
				var sOrderNumber = oOrderFld.getValue();
				var sSelectedReasonCode = this.byId("idReasonCodeSelect").getSelectedKey();
				var articleTable = this.byId('idArticlesTable');
				var firstRow = articleTable.getItems()[0];

				var poPanel = this.getView().byId("idPOtablePanel");

				var articleModel = this.getModel("articleModel"),
					articleModelData = articleModel.getData(),
					bindingContext = firstRow.getBindingContext("articleModel"),
					articleId = articleModel.getProperty("MATNR", bindingContext);

				var aFilters = [
					new Filter("MATNR", "EQ", articleId),
					new Filter("VBELN", "EQ", sOrderNumber)
				];

				var oModel = this.getModel();
				var controlVisModel = this.getModel("controlVis");
				var that = this;
				var tempPOVendors = [];
				busy(); //this.getModel("detailView").setProperty("/busy", true);
				oModel.read("/OrderValidateSet", {
					filters: aFilters,
					urlParameters: {
						"$expand": "OrderItemSet,POItemSet,POVendorSet"
					},
					success: function (oData) {
						notBusy(); //that.getModel("detailView").setProperty("/busy", false);
						poPanel.setExpanded(true);
						that.clearFldsOnOrderChange(that);
						oOrderFld.setValueState(ValueState.None);
						oOrderFld.setValueStateText("");
						var POItemSet = oData.results[0].POItemSet.results;
						var OrderItemSet = oData.results[0].OrderItemSet.results;
						var POVendorSet = oData.results[0].POVendorSet.results;

						that.getModel("articleModel").setProperty("/UoMText", OrderItemSet[0].VRKME);
						for (var i = 0; i < POVendorSet.length; i++) {
							for (var j = 0; j < POVendorSet.length; j++) {
								if (i !== j && POVendorSet[i].LIFNR !== POVendorSet[j].LIFNR && tempPOVendors.indexOf(POVendorSet[i]) === -1) {
									tempPOVendors.push(POVendorSet[i]);
								}
							}
						}
						if (tempPOVendors.length === 0 && POVendorSet[0]) {
							tempPOVendors.push(POVendorSet[0]);
						}

						oData.results[0].POVendorSet.results = tempPOVendors;

						that.getModel("poModel").setData(oData.results[0]);
						var poItemTable = that.byId('idPOitemTable');
						poItemTable.removeSelections();
						var list = that.byId("idPOitemTable");

						if (POItemSet.length > 1) {
							//call Multiple PO scenario
							controlVisModel.setProperty("/poTableVisible", true);
							controlVisModel.setProperty("/salesOrderItemVisible", false);
							controlVisModel.setProperty("/articleItemCostWithPO", true);
							controlVisModel.setProperty("/articleItemCostNoPO", false);
							articleModelData.Articles[0].QtyEnabled = false;
							articleModel.checkUpdate(true);
						} else if (POItemSet.length === 1) {

							//call Single PO scenario
							var POItem = POItemSet[0];
							that.showDefaultComUoM(POItem, "Single");
							that.showComItemCost(POItem, "Single", that);
							that.getVendors(true);
							controlVisModel.setProperty("/salesOrderItemVisible", false);
							controlVisModel.setProperty("/articleItemCostWithPO", true);
							controlVisModel.setProperty("/articleItemCostNoPO", false);

						} else {
							//call No PO scenario
							controlVisModel.setProperty("/salesOrderItemVisible", true);
							controlVisModel.setProperty("/articleItemCostWithPO", false);
							controlVisModel.setProperty("/articleItemCostNoPO", true);

							that.showDefaultComUoM(OrderItemSet[0], "NoPO");
							that.getVendors(true);
						}

					},
					error: function (oError) {
						notBusy(); //that.getModel("detailView").setProperty("/busy", false);
						that.clearFldsOnOrderChange(that);
						articleModelData.Articles[0].ItemQty = "";
						oOrderFld.setValueState(ValueState.Error);
						oOrderFld.setValueStateText("");
						if (oError.responseText.indexOf('{"') !== -1) {
							var oErrorJSON = JSON.parse(oError.responseText);
							MessageToast.show(oErrorJSON.error.message.value);
						} else {
							sap.m.MessageBox.show(
								JSON.parse(oError.responseText).error.message.value, {
									icon: sap.m.MessageBox.Icon.ERROR,
									title: that.getResourceBundle().getText("Error"),
									actions: [sap.m.MessageBox.Action.OK]
								});
						}
					}
				});
			}
		},

		orderChangeValidation: function (evt) {
			var articleFld = evt.getSource();
			var liveValue = articleFld.getValue();
			var articleData = this.getModel("poModel").oData;
			if (liveValue.indexOf(".") === -1 && !isNaN(liveValue) && Number(liveValue) !== 0 && liveValue.length !== 0 && articleData !==
				"e" &&
				articleData !== "-" && articleData !== "+") {
				articleFld.setValueState(ValueState.None);
				return true;
			} else {
				liveValue = liveValue.replace(articleData, "");
				articleFld.setValue(liveValue);
				articleFld.setValueState(ValueState.Error);
				articleFld.setValueStateText("");
				this.clearFldsOnOrderChange(this);
				return false;
			}
		},

		clearFldsOnOrderChange: function (that) {
			var oView = this.getView();

			var vendorFld = oView.byId("idVendorSelect");
			var orderItemFld = oView.byId("idOrderItemFld");
			var defectiveAllowFld = oView.byId("idDefctAllw");
			var vendorModel = vendorFld.getModel("vendorModel");
			var articleTable = oView.byId("idArticlesTable");
			var poItemPanel = oView.byId("idPOtablePanel");
			var poItemTable = oView.byId("idPOitemTable");
			var poModel = poItemTable.getModel("poModel");
			var ctrlVisModel = this.getModel("controlVis");
			var articleModel = this.getModel("articleModel");
			ctrlVisModel.setProperty("/salesOrderItemVisible", false);
			ctrlVisModel.setProperty("/articleItemCostNoPO", false);
			ctrlVisModel.setProperty("/articleItemCostWithPO", true);

			poModel.setData({});
			poModel.updateBindings(false);
			poItemTable.removeSelections();
			poItemTable.rerender();

			var fisrtRow = articleTable.getItems()[0];

			vendorModel.setData({});
			vendorModel.updateBindings(false);
			poItemPanel.setVisible(false);
			articleModel.getData().Articles[0].ItemCost = "";
			articleModel.getData().Articles[0].NegotiatedCost = "0.00";
			articleModel.getData().Articles[0].NegotiatedCostCurrency = "CAD";
			articleModel.getData().Articles[0].QtyEnabled = false;
			articleModel.getData().Articles[0].DispCodeText = "";
			articleModel.getData().Articles[0].DISP_COD = "";
			defectiveAllowFld.unbindText();
			vendorFld.clearSelection();
			vendorFld.rerender();
			orderItemFld.clearSelection();
			orderItemFld.rerender();

			this.getModel("articleModel").setProperty("/UoMText", "");
		},

		onPOItemSelectionChange: function (evt) {
			var oSelectedRow = evt.getParameters('selected').listItem;
			var vendorFld = this.byId("idVendorSelect");
			var articleTable = this.byId('idArticlesTable');
			var firstRow = articleTable.getItems()[0];
			var qtyFld = firstRow.getCells()[1];
			var qtyEntered = qtyFld.getValue();
			var poPanel = this.getView().byId("idPOtablePanel");
			poPanel.setExpanded(false);
			this.showDefaultComUoM(oSelectedRow, "Multiple");
			this.showComItemCost(oSelectedRow, "Multiple", this);
			var selectedPOVendor = oSelectedRow.getCells()[2].getText();
			var selectedVendor = vendorFld.getSelectedKey();
			var defectiveAllowFld = this.byId("idDefctAllw");
			defectiveAllowFld.bindProperty("text", "DEF_ALLOW");

			if (selectedVendor.length === 0) {
				this.getVendors(true);
			} else {
				this.callPCT();
			}

			vendorFld.setSelectedKey(selectedPOVendor);

			if (qtyEntered.length !== 0) {
				qtyFld.fireEvent("change");
			}
		},

		onOrderItemChange: function () {
			var articleTable = this.byId('idArticlesTable');
			var firstRow = articleTable.getItems()[0];
			var qtyFld = firstRow.getCells()[1];
			var qtyEntered = qtyFld.getValue();

			if (qtyEntered.length !== 0) {
				qtyFld.fireEvent("change");
			}
		},

		getPOVendors: function () {
			var poModelData = this.getModel("poModel").getData();
			var vendorModel = this.getModel("vendorModel");
			var vendorModelData = vendorModel.getData();

			if (!vendorModelData.results) {
				vendorModelData = poModelData.POVendorSet;
				if (vendorModelData && vendorModelData.results && vendorModelData.results.length !== 0) {
					vendorModel.setData(vendorModelData);
					vendorModel.updateBindings(false);
				}
			}
		},

		showDefaultComUoM: function (oSelectedRow, noOfPOs) {
			var refSO, refSOItem, defaultUoM = null;
			var articleTable = this.byId('idArticlesTable');
			var firstRow = articleTable.getItems()[0];
			var UoMfld = firstRow.getCells()[2].getItems()[1];
			var qtyFld = firstRow.getCells()[1];
			var that = this;

			qtyFld.setEnabled(true);

			if (noOfPOs === "Multiple") {
				refSO = oSelectedRow.getCustomData()[0].getValue();
				refSOItem = oSelectedRow.getCustomData()[1].getValue();
			} else if (noOfPOs === "Single") {
				refSO = oSelectedRow.REF_VBELN;
				refSOItem = oSelectedRow.REF_VBELP;
			} else {
				UoMfld.setSelectedKey(oSelectedRow.VRKME);
				UoMfld.setEnabled(true);
				return;
			}

			var poModel = this.getModel("poModel");
			var poModelData = poModel.getData();

			for (var item = 0; item < poModelData.OrderItemSet.results.length; item++) {
				if (refSO === poModelData.OrderItemSet.results[item].REF_VBELN && refSOItem === poModelData.OrderItemSet.results[item].REF_VBELP) {
					defaultUoM = poModelData.OrderItemSet.results[item].VRKME;
					break;
				}
			}

			if (defaultUoM === null) {
				sap.m.MessageBox.show(
					this.getResourceBundle().getText("UomIsMissingPleaseContactHelpdesk"), {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: this.getResourceBundle().getText("Error"),
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function (oAction) {
							if (oAction === sap.m.MessageBox.Action.OK) {
								that.getRouter().navTo("master", {}, true);
								that.clearAllFlds();
							}
						}
					});
			}

			UoMfld.setSelectedKey(defaultUoM);
		},

		showComItemCost: function (oSelectedRow, noOfPOs, that) {
			var selectedPOItemCost, currency, ItemCost;

			if (noOfPOs === "Multiple") {
				var selectedObj = oSelectedRow.getBindingContext("poModel").getObject();
				selectedPOItemCost = selectedObj.NETPR;
				currency = selectedObj.WAERS;
			} else if (noOfPOs === "Single") {
				selectedPOItemCost = oSelectedRow.NETPR;
				currency = oSelectedRow.WAERS;
			}

			var articleModel = that.getModel("articleModel"),
				article = articleModel.getData().Articles[0];

			var vendorFld = that.getView().byId("idVendorSelect");
			var vendorsLength = vendorFld.getItems().length;

			if (article.MTART === "Z001" && vendorsLength !== 0) {
				var customDate = vendorFld.getSelectedItem().getCustomData();
				if (customDate.length !== 0) {
					ItemCost = customDate[1].getValue();
					if (ItemCost !== null) {
						selectedPOItemCost = ItemCost;
					}
				}
			}

			article.ItemCost = selectedPOItemCost;
			article.ItemCostCurrency = currency;
			article.NegotiatedCost = selectedPOItemCost;
			article.NegotiatedCostCurrency = currency;
		},

		onItemCostLiveChange: function (evt) {
			var itemCostFld = evt.getSource();
			var value = evt.getParameter("value");
			value = value.replace(/[^\d.]/g, "");
			if (value.indexOf(".") > -1) {
				value = value.split(".")[0] + "." + value.split(".")[1].substring(0, 2);
			}

			itemCostFld.getBindingContext("articleModel").getObject().ItemCost = value;
			itemCostFld.updateDomValue(value);
			itemCostFld.setValueState(ValueState.None);
		},

		onNegotiatedCostLiveChange: function (evt) {
			var negCostFld = evt.getSource();
			var value = evt.getParameter("value");
			value = value.replace(/[^\d.]/g, "");
			if (value.indexOf(".") > -1) {
				value = value.split(".")[0] + "." + value.split(".")[1].substring(0, 2);
			}

			negCostFld.getBindingContext("articleModel").getObject().NegotiatedCost = value;
			negCostFld.updateDomValue(value);
			negCostFld.setValueState(ValueState.None);
		},

		onItemCostChange: function (evt) {
			var ItemCostFld = evt.getSource();
			var ItemCostValue = ItemCostFld.getBindingContext("articleModel").getObject().ItemCost;
			if (ItemCostValue.indexOf(".") !== -1) {
				if (ItemCostValue.split(".")[1].length === 0) {
					ItemCostValue = ItemCostValue.split(".")[0];
					ItemCostFld.getBindingContext("articleModel").getObject().ItemCost = ItemCostValue;
					ItemCostFld.updateDomValue(ItemCostValue);
				}
			}
			if (ItemCostValue.length !== 0 && Number(ItemCostValue) !== 0) {
				this.callPCT();
			} else {
				ItemCostFld.getModel("articleModel").getData().CreateEnabled = false;
			}
			ItemCostFld.getModel("articleModel").checkUpdate(true);
		},

		onVerifyPress: function (selectedDispositionActionCode) {
			var vendorModel = this.getModel("vendorModel");
			var vendorModelData = vendorModel.getData();

			var articleModel = this.getModel('articleModel'),
				articleModelData = articleModel.getData(),
				articleId = articleModelData.Articles[0].MATNR;

			var articleTable = this.byId('idArticlesTable');
			var firstRow = articleTable.getItems()[0];

			var poItemTable = this.byId('idPOitemTable');
			var diffectAllwFld = this.byId('idDefctAllw');
			var pctModel = this.getModel('pctJSONModel');
			var pctModelData = pctModel.getData().results[0];
			var poModel = this.getModel('poModel');
			var POItemSet = poModel.getData().POItemSet;
			var OrderItemSet = poModel.getData().OrderItemSet;
			var selectedPOItem;
			var orderItemFld = this.byId('idOrderItemFld');

			var RTV_TYPE = articleModelData.Articles[0].RTV_TYPE; //!!!!!!!!!!!!!!!!!  CHANGE ASAP
			var MTART = articleModelData.Articles[0].MTART; //!!!!!!!!!!!!!!!!!  CHANGE ASAP
			var PRICE = articleModelData.Articles[0].PRICE; //!!!!!!!!!!!!!!!!!  CHANGE ASAP
			var VTWEG = articleModelData.Articles[0].VTWEG;

			var ORIGIN_COD = articleModelData.OriginCode;
			var ERDAT = "";
			var ERNAM = "";
			var path = this.byId('idArticlesTable').getItems()[0].getCells()[2].getItems()[1].getSelectedItem().getBindingContext(
				'articleModel').sPath;
			var EAN11 = this.getModel('articleModel').getObject(path).upc;
			var MENGE = Number(firstRow.getCells()[1].getValue()) + ""; //converts to string - dont remove blanck quotes
			var MEINS = firstRow.getCells()[2].getItems()[1].getSelectedKey();
			var LIFNR = this.byId('idVendorSelect').getSelectedKey();
			var DEF_ALLOW_PERC = this.getModel().getObject(diffectAllwFld.getBindingContext().sPath).DEF_ALLOW_PERC;
			var ITEM_COST = articleModelData.Articles[0].ItemCost;
			var CURRENCY = articleModelData.Articles[0].ItemCostCurrency;

			var ORIG_ITEM_COST = "0.00";
			var ORIG_CURRENCY = "";
			var LGORT = firstRow.getCells()[1].getCustomData()[0].getValue();
			var COMMENTS = articleModelData.Articles[0].Comments;
			var RGA_NUM = articleModelData.Articles[0].RGA;
			var RTV_LOC = articleModelData.Articles[0].RtvLoc;
			var DISP_COD = articleModelData.Articles[0].DISP_COD;
			var DISP_ACT_COD = selectedDispositionActionCode;
			var INSP_REQ_FLG = pctModel.getData().results[0].INSP_REQ_FLG;
			var SHIP_MIN_VAL = pctModel.getData().results[0].SHIP_MIN_VAL;
			var RGA_REQ_FLG = pctModel.getData().results[0].RGA_REQ_FLG;
			var COM_EBELN = "";
			var COM_EBELP = "";
			var COM_VBELN = "";
			var COM_VBELP = "";
			var REF_VBELN = "";
			var REF_VBELP = "";
			var LABEL_COLOR = pctModel.getData().results[0].LABEL_COLOR;

			//OnHandChek is false for Charge back, so we are not considering Item Cost only in this case.
			if (articleModelData.OnHandCheck && !ITEM_COST) {

				firstRow.getCells()[4].getItems()[0].setValueState(ValueState.Error);
				firstRow.getCells()[4].getItems()[0].setValueStateText("");

				sap.m.MessageToast.show(this.getResourceBundle().getText("PleaseEnterValidIemCost"));

				return;
			}

			if (ORIGIN_COD === "COM") {
				if (POItemSet.results.length > 1) {
					selectedPOItem = poItemTable.getSelectedItem();
					var POItemPath = selectedPOItem.getBindingContext("poModel").sPath;
					var obj = poModel.getObject(POItemPath);
					COM_EBELN = obj.COM_EBELN;
					COM_EBELP = obj.COM_EBELP;
					REF_VBELN = obj.REF_VBELN;
					REF_VBELP = obj.REF_VBELP;
					ORIG_ITEM_COST = obj.ORIG_ITEM_COST;
					ORIG_CURRENCY = obj.ORIG_CURRENCY;
					ITEM_COST = obj.NETPR;
					CURRENCY = obj.WAERS;
					for (var i = 0; i < OrderItemSet.results.length; i++) {
						if (REF_VBELN === OrderItemSet.results[i].REF_VBELN && REF_VBELP === OrderItemSet.results[i].REF_VBELP) {
							COM_VBELN = OrderItemSet.results[i].COM_VBELN;
							COM_VBELP = OrderItemSet.results[i].COM_VBELP;
							break;
						}
					}
				} else if (POItemSet.results.length === 1 && MTART !== "Z001") {
					COM_EBELN = POItemSet.results[0].COM_EBELN;
					COM_EBELP = POItemSet.results[0].COM_EBELP;
					REF_VBELN = POItemSet.results[0].REF_VBELN;
					REF_VBELP = POItemSet.results[0].REF_VBELP;
					ORIG_ITEM_COST = POItemSet.results[0].ORIG_ITEM_COST;
					ORIG_CURRENCY = POItemSet.results[0].ORIG_CURRENCY;
					ITEM_COST = POItemSet.results[0].NETPR;
					CURRENCY = POItemSet.results[0].WAERS;
					for (var j = 0; OrderItemSet.results.length; j++) {
						if (REF_VBELN === OrderItemSet.results[j].REF_VBELN && REF_VBELP === OrderItemSet.results[j].REF_VBELP) {
							COM_VBELN = OrderItemSet.results[j].COM_VBELN;
							COM_VBELP = OrderItemSet.results[j].COM_VBELP;

							break;
						}
					}
				} else {
					var sPath = this.getModel('poModel').getContext('/OrderItemSet').sPath; //orderItemFld.getBindingContext('poModel').sPath;
					var OrderItemObj = poModel.getObject(sPath).results[0];
					COM_VBELN = OrderItemObj.COM_VBELN;
					COM_VBELP = OrderItemObj.COM_VBELP;
					REF_VBELN = OrderItemObj.REF_VBELN;
					REF_VBELP = OrderItemObj.REF_VBELP;
					ITEM_COST = Number(articleTable.getItems()[0].getCells()[4].getItems()[0].getValue()) + ""; //converts to string - dont remove blanck quotes
					CURRENCY = articleTable.getItems()[0].getCells()[4].getItems()[1].getSelectedKey();
				}
			}

			//getting VENDOR from selected vendor
			var Vendor;
			vendorModelData.results.some(function (element, index, array) {
				if (element.LIFNR === LIFNR) {
					Vendor = element.VENDOR;
					return true;
				}
			});

			var payload = {
				"WERKS": this.StoreId,
				"RTV_TYPE": RTV_TYPE,
				"ORIGIN_COD": ORIGIN_COD,
				"REASON_CODE": articleModelData.ReasonCode,
				"ERDAT": " ",
				"ERNAM": ERNAM,

				"articleset": [{
					"MATNR": articleId,
					"EAN11": EAN11,
					"MTART": MTART,
					"MENGE": MENGE,
					"MEINS": MEINS,
					"LIFNR": LIFNR,
					"VENDOR": Vendor,
					"DEF_ALLOW_PERC": DEF_ALLOW_PERC,
					"ITEM_COST": ITEM_COST,
					"CURRENCY": CURRENCY,
					"PRICE": PRICE,
					"ORIG_ITEM_COST": ORIG_ITEM_COST,
					"ORIG_CURRENCY": ORIG_CURRENCY,
					"LGORT": LGORT,
					"COMMENTS": COMMENTS,
					"RGA_NUM": RGA_NUM,
					"RTV_LOC": RTV_LOC,
					"DISP_COD": DISP_COD,
					"DISP_ACT_COD": DISP_ACT_COD,
					"INSP_REQ_FLG": INSP_REQ_FLG,
					"SHIP_MIN_VAL": SHIP_MIN_VAL,
					"RGA_REQ_FLG": RGA_REQ_FLG,
					"COM_EBELN": COM_EBELN,
					"COM_EBELP": COM_EBELP,
					"COM_VBELN": COM_VBELN,
					"COM_VBELP": COM_VBELP,
					"REF_VBELN": REF_VBELN,
					"REF_VBELP": REF_VBELP,
					"RETURNS_EBELN": articleModelData.PurchaseOrderNum,
					"RETURNS_EBELP": articleModelData.RETURNS_EBELP,
					"VTWEG": VTWEG,
					"NEGOTIATED_COST": (articleModelData.ReasonCode === "20" || articleModelData.ReasonCode === "30") ? articleModelData.Articles[
						0].NegotiatedCost : "0.00",
					"NEGOTIATED_CUKY": (articleModelData.ReasonCode === "20" || articleModelData.ReasonCode === "30") ? articleModelData.Articles[
						0].NegotiatedCostCurrency : "",
					"CARRIER": pctModelData.CARRIER,
					"SELF_SERV_FLG": pctModelData.SELF_SERV_FLG,
					"POLICY_ID": pctModelData.POLICY_ID,
					"CITY1": pctModelData.CITY1,
					"REGION": pctModelData.REGION,
					"COUNTY": pctModelData.COUNTY,
					"POST_CODE_1": pctModelData.POST_CODE_1,
					"COUNTRY": pctModelData.COUNTRY,
					"CLASS": pctModelData.CLASS,
					"SUBCLASS": pctModelData.SUBCLASS,
					"DEPT": pctModelData.DEPT,
					"POL_RTN_COD": pctModelData.POL_RTN_COD,
					"POS_TRANS_ID": pctModelData.POS_TRANS_ID,
					"POS_REG_NO": pctModelData.POS_REG_NO,
					// "POS_RET_DATE": pctModelData.POS_RET_DATE,
					"POS_RET_DATE": " ",
					"POS_RSN_DESC": pctModelData.POS_RSN_DESC,
					"SHIP_MIN_F_PERC": pctModelData.SHIP_MIN_F_PERC,
					"RESTOCK_FEE": pctModelData.RESTOCK_FEE,
					"RESTOCK_FEE_PERC": pctModelData.RESTOCK_FEE_PERC,
					"AUTO_CHRG_FLG": pctModelData.AUTO_CHRG_FLG,
					"INB_FRGHT_PERC": pctModelData.INB_FRGHT_PERC,
					"PAYTHRU_SCAN_FLG": pctModelData.PAYTHRU_SCAN_FLG,
					"FRGHT_TERM_COD": pctModelData.FRGHT_TERM_COD,
					"FOB_COD": pctModelData.FOB_COD,
					"INSP_FEE_PERC": pctModelData.INSP_FEE_PERC,
					"RGA_FEE_PERC": pctModelData.RGA_FEE_PERC,
					"OFF_ACTION_COD": pctModelData.OFF_ACTION_COD,
					"OFF_INSP_FLG": pctModelData.OFF_INSP_FLG,
					"OFF_PICK_FLG": pctModelData.OFF_PICK_FLG,
					"TRIP_CHRG_LIMT": pctModelData.TRIP_CHRG_LIMT,
					"SPKG_CARR_ID": pctModelData.SPKG_CARR_ID,
					"LTL_CARR_ID": pctModelData.LTL_CARR_ID,
					"ADDR_NO": pctModelData.ADDR_NO,
					"ADDR_LINE1_TXT": pctModelData.ADDR_LINE1_TXT,
					"ADDR_LINE2_TXT": pctModelData.ADDR_LINE2_TXT,
					"ADDR_LINE3_TXT": pctModelData.ADDR_LINE3_TXT,
					"ADDR_LINE4_TXT": pctModelData.ADDR_LINE4_TXT,
					"ADDR_LINE5_TXT": pctModelData.ADDR_LINE5_TXT,
					"CP_NAME": pctModelData.CP_NAME,
					"TEL_NUMBER": pctModelData.TEL_NUMBER,
					"TEL_EXTENS": pctModelData.TEL_EXTENS,
					"FAX_NUMBER": pctModelData.FAX_NUMBER,
					"FAX_EXTENS": pctModelData.FAX_EXTENS,

					"labelset": articleModelData.Articles[0].Labels.map(function (item) {
						return {
							LABEL_NUM: item.Value,
							LABEL_COLOR: item.LabelColor
						};
					})
				}]
			};

			//PRICE value comparision
			var minPrice, maxPrice;
			if (articleModelData.Articles[0].NegotiatedCostCurrency === "CAD") {
				minPrice = articleModelData.MinPriceCAD;
				maxPrice = articleModelData.MaxPriceCAD;
			} else {
				minPrice = articleModelData.MinPriceUSD;
				maxPrice = articleModelData.MaxPriceUSD;
			}
			var qty = articleModelData.Articles[0].ItemQty;
			var cost = (articleModelData.ReasonCode === '20' || articleModelData.ReasonCode === '30') ? articleModelData.Articles[0].NegotiatedCost :
				articleModelData.Articles[0].ItemCost;
			var NagotiatedCostFld = firstRow.getCells()[5].getItems()[0];
			var priceFromUi = Number(qty) * Number(cost);
			var message;
			if (!articleModelData.OnHandCheck && Number(minPrice) > priceFromUi) {
				message = this.getResourceBundle().getText("ChargebackMinimumHasNotBeenMet", [articleModelData.MinPriceCAD, "CAD"]);
				this.priceErrorMessage(message);
				return;
			} else if (!articleModelData.OnHandCheck && Number(maxPrice) < priceFromUi) {
				message = this.getResourceBundle().getText("ChargebackMaximumHasNotBeenMet", [articleModelData.MaxPriceCAD, "CAD"]);
				this.priceErrorMessage(message);
				return;
			} else {
				NagotiatedCostFld.setValueState(ValueState.None);
			}

			this.createRTV(payload);
		},

		priceErrorMessage: function (msg) {
			var NagotiatedCostFld = this.getView().byId("NagotiatedCostFld");
			sap.m.MessageBox.show(
				msg, {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: this.getResourceBundle().getText("Error"),
					actions: [sap.m.MessageBox.Action.OK],
					onClose: function (oAction) {
						if (oAction === "OK") {
							NagotiatedCostFld.setValueState(ValueState.Error); //Need to update based on model
						}
					}
				});
		},

		createRTV: function (objectForCreateRTV) {
			busy();

			var oModel = this.getModel();
			var that = this;

			oModel.create("/HeaderSet",
				objectForCreateRTV, {
					async: true,

					success: function (odata, response) {
						notBusy();
						that.getRouter().navTo("master", {}, true);
						that.clearAllFlds();
						MessageToast.show((that.getResourceBundle().getText("LBL_CRT")), {
							duration: 2000,
							closeOnBrowserNavigation: false
						});
					},
					error: function (oError, resp1, resp2) {
						notBusy();

						if (oError.responseText.indexOf('{"') !== -1) {
							var oErrorJSON = JSON.parse(oError.responseText);
							sap.m.MessageBox.show(
								oErrorJSON.error.message.value, {
									icon: sap.m.MessageBox.Icon.ERROR,
									title: that.getResourceBundle().getText("Error"),
									actions: [sap.m.MessageBox.Action.OK],
									onClose: function (oAction) {}
								});
						} else {
							sap.m.MessageBox.show(
								JSON.parse(oError.responseText).error.message.value, {
									icon: sap.m.MessageBox.Icon.ERROR,
									title: that.getResourceBundle().getText("Error"),
									actions: [sap.m.MessageBox.Action.OK],
									onClose: function (oAction) {}
								});
						}
					}
				});
		},

		propogateLabels: function (oEvent) {
			var source = $.isFunction(oEvent.placeAt) ? oEvent : oEvent.getSource(),
				bindingContext = source.getBindingContext("articleModel"),
				articleModel = this.getModel("articleModel"),
				articleModelData = articleModel.getData(),
				articleModelObject = bindingContext.getObject(),
				pressed = $.isFunction(oEvent.placeAt) ?
				articleModel.getProperty("propogateLabels", bindingContext) :
				oEvent.getParameter("state");

			source.$().blur();

			articleModel.setProperty("propogateLabels", pressed, bindingContext);

			var done = $.Deferred();
			var that = this;
			done.then(function () {
				articleModel.checkUpdate(true);
				source.getParent().getCells()[5].getItems()[1].rerender();

				var LabelsTable;

				source.getParent().getCells().some(function (element) {
					if (element.getId().indexOf("LabelsTable") != -1) {
						LabelsTable = element;
						return true;
					} else {
						return false;
					}
				});

				if (LabelsTable) {
					var aItems = LabelsTable.getItems();

					for (var i = 0; i < aItems.length; i++) {
						var _input_ = aItems[i].getContent()[0];

						if (!_input_.getValue()) {
							jQuery.sap.delayedCall(500, _input_, function () {
								_input_.focus();
								__controller__.onVKeypadHide();
							});
							return;
						}
					}
				}
			});

			if (pressed) {
				var itemQtyInt = parseInt(articleModelObject.ItemQty);

				if (itemQtyInt != articleModelObject.Labels.length) {
					var diff = itemQtyInt - articleModelObject.Labels.length;

					if (diff > 0) {
						if (!!articleModelObject.AutoLabelNumber) {
							var __index__ = articleModelObject.Labels.length - 1;

							if (articleModelObject.Labels &&
								articleModelObject.Labels[__index__] &&
								articleModelObject.Labels[__index__].Value &&
								articleModelObject.Labels[__index__].Value.length === 17) {

								var labelNumberBase = parseInt(articleModelObject.Labels[__index__].Value.substr(5));
								var labelNumberPrefix = articleModelObject.Labels[__index__].Value.substr(0, 5);

							}
						}

						for (var i = 1; i <= diff; i++) {
							articleModelObject.Labels.push({
								Valid: !!articleModelObject.AutoLabelNumber,
								Enabled: !articleModelObject.AutoLabelNumber,
								Value: articleModelObject.AutoLabelNumber ? labelNumberPrefix + ++labelNumberBase : "",
								LabelColor: articleModelObject.LabelColor,
								Placeholder: labelPlaceholder(articleModelObject.LabelColor)
							});
						}
					}

					if (diff < 0) {
						articleModelObject.Labels = articleModelObject.Labels.slice(0, itemQtyInt);
					}

					done.resolve();
				}
			} else {
				articleModelObject.Labels = articleModelObject.Labels.slice(0, 1);

				done.resolve();
			}
		},

		onArticleNumberPress: function (oEvent) {
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				jQuery.sap.require("jquery.sap.storage");
				var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
				oStorage.put("navBackFromALU", {
					"navBackFromALU": true
				});
				var article = oEvent.getSource().getText();
				var dialog = new Dialog({
					title: this.getResourceBundle().getText("Warning"),
					type: 'Message',
					state: 'Warning',
					content: new Text({
						text: this.getResourceBundle().getText("toALU")
					}),
					beginButton: new Button({
						text: this.getResourceBundle().getText("Yes"),
						press: function () {
							dialog.close();
							var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
							var storid = __controller__.StoreId;

							var action = "Y_LOOKUP&/product/" + storid + "/00000000" + article + "";
							oCrossAppNavigator.toExternal({
								target: {
									semanticObject: "Article",
									action: action
								}
							});
						}
					}),
					endButton: new Button({
						text: this.getResourceBundle().getText("Cancel"),
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function () {
						dialog.destroy();
					}
				});
				dialog.open();

			} else {
				//alert("App to app navigation is not supported in this mode");
			}
		},

		onExit: function () {
			// this.byId("ArticleItem").destroy();
			// this.byId("LabelsTableItem").destroy();
		}
	});
});