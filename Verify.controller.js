sap.ui.define([
	"YRTV_ONE_TILE/YRTV_ONE_TILE/controller/CreateVerify/BaseController",
	"sap/ui/core/Item",
	"YRTV_ONE_TILE/YRTV_ONE_TILE/model/CreateVerify/formatter",
	"sap/ui/core/CustomData",
	"sap/ui/model/Filter",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Text",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/core/ValueState"
], function (BaseController, Item, formatter, CustomData, Filter, Dialog, Button, Text, JSONModel, MessageToast, MessageBox, ValueState) {
	"use strict";

	var __controller__;

	var busy = function () {
		__controller__.getModel("verifyView").setProperty("/busy", true);
		__controller__.getModel("appView").setProperty("/busy", true);
	};

	var notBusy = function (promise) {
		if (promise) {
			$.when(promise).done(function () {
				__controller__.getModel("verifyView").setProperty("/busy", false);
			});
		} else {
			__controller__.getModel("appView").setProperty("/busy", false);
			__controller__.getModel("verifyView").setProperty("/busy", false);
		}
	};

	var COLOR_MAPPING = {
		"1": {
			styleClass: "redLabelVerify",
			placeholder: "Red"
		},
		"2": {
			styleClass: "yellowLabelVerify",
			placeholder: "Yellow"
		},
		"3": {
			styleClass: "greenLabelVerify",
			placeholder: "Green"
		},
		"4": {
			styleClass: "whiteLabelVerify",
			placeholder: "White"
		}
	};

	var labelPlaceholder = function (labelColor) {
		return COLOR_MAPPING[labelColor] ? COLOR_MAPPING[labelColor].placeholder : "";
	};

	var labelStyleClass = function (labelNum) {
		var labelColor = labelNum.substring(4, 5);
		return COLOR_MAPPING[labelColor] ? COLOR_MAPPING[labelColor].styleClass : "";
	};

	return BaseController.extend("YRTV_ONE_TILE.YRTV_ONE_TILE.controller.CreateVerify.Verify", {
		//StoreId: "7001",

		formatter: formatter,

		onInit: function () {
			__controller__ = this;

			this.getRouter().getRoute("verify").attachPatternMatched(this.onVerifyMatched, this);

			var verifyViewData = {};

			if (!Object.getOwnPropertyDescriptor(verifyViewData, "VerifyEnabled")) {
				Object.defineProperty(verifyViewData, "VerifyEnabled", {
					set: function () {},
					get: function () {
						if (!__controller__.getView().getBindingContext()) return false;

						var verifyViewModel = __controller__.getModel("verifyView"),
							article = verifyViewModel.getProperty("/Article");

						if (!article) return false;

						var labelObject = __controller__.getView().getBindingContext().getObject();

						if (Number(labelObject.ItemCost) === 0 || isNaN(Number(labelObject.ItemCost))) {
							if (labelObject.Origin === "POS") {
								if (article.MTART === "Z001") {
									return false;
								}
							} else if (labelObject.Origin === "COM") {
								if (article.MTART === "Z001") {
									if (labelObject.ReasonCode === "31") {
										//"Cost comes from MAC which would never be zero. If it does come as $0, allow user to process"
										return true;
									} else {
										return false;
									}
								} else if (article.MTART === "Z003") {
									//System allows user to Verify the label although cost is = $0
									return true;
								}
							}
						}

						if (labelObject.ReasonCode === "30" || labelObject.ReasonCode === "20") {
							if (!labelObject.RGANum) {
								return false;
							}

							if (Number(labelObject.NegotiatedCost) === 0) {
								return false;
							}
						} else {
							if (!labelObject.DispCod && labelObject.ReasonCode !== "31") { //PCT call failed
								return false;
							}
						}
						
						if(labelObject.DispCod === '04'){ //For DispCod 04(Repair)
							return false;
						}

						return true;
					}
				});
			}

			this.setModel(new JSONModel(verifyViewData), "verifyView");
			var verifyModel = new JSONModel();
			this.setModel(verifyModel, "verifyModel");

			// this.getModel("verifyView").setSizeLimit(1000);

			var Label = this.byId("RTVLabelLink");

			Label.addDelegate({
				onAfterRendering: function () {
					if (!this.getBindingContext()) {
						return;
					}

					var labelObject = this.getBindingContext().getObject(),
						labelNum = labelObject.LabelNum;

					this.removeStyleClass("articleNumber").removeStyleClass("redLabelVerify").removeStyleClass("yellowLabelVerify").removeStyleClass(
						"greenLabelVerify").removeStyleClass("whiteLabelVerify");

					if (labelObject.LabelNum) {
						this.addStyleClass(labelStyleClass(labelObject.LabelNum));
					}

					$("#" + this.getId() + "-inner").attr('title', labelNum);

				}
			}, false, Label, true);

		},

		onVerifyMatched: function (oEvent) {
			var labelNum = oEvent.getParameters().arguments.LabelNum,
				werks = oEvent.getParameters().arguments.Werks;
			this._AuthorizationVerifyAccess(labelNum, werks);
			this.getView().getAggregation('content')[0].setEnableScrolling(true);
			var oText = this.getResourceBundle().getText("verifyTitle"),
				oAuthModel = this.getOwnerComponent().getModel("oAuthModel"),
				oAuthData = oAuthModel.getData();
			// var oDetailPage = this.getView().byId("VerifyPage");
			// oDetailPage.setTitle

			var controller = this;
			var oParameters = oEvent.getParameters();
			if (oParameters.name === "verify") {
				// var labelNum = oParameters.arguments.LabelNum,
				// 	werks = oParameters.arguments.Werks,
				var oDataModel = this.getGlobalModel(),
					verifyViewModel = this.getModel("verifyView"),
					verifyModel = this.getModel("verifyModel");
				this.siteId = werks;

				var objectLoaded = $.Deferred();
				var objectNotFound = $.Deferred();
				this.byId("idCommentsFld").setValue("");
				var verifyObject = oDataModel.getProperty("/VerifySet(LabelNum='" + labelNum + "',Werks='" + werks + "')");
				// // Set This Title only PSC USers
				// if (oAuthData.results[0].PSC_User == 'Y') {
				// 	oTitle = oText + '-' + verifyObject.Werks;
				// 	oDetailPage.setTitle(oTitle);
				// }
				var __vendor__, that = this;

				if (verifyObject && verifyObject.Matnr) {
					objectLoaded.resolve();
					__vendor__ = this.removeLeadingZeroes(verifyObject.Lifnr);
				} else {
					oDataModel.attachRequestCompleted(function (evt) {
						var detailObject = oDataModel.getProperty("/VerifySet(LabelNum='" + labelNum + "',Werks='" + werks + "')");

						if (detailObject && detailObject.Matnr) {
							__vendor__ = that.removeLeadingZeroes(detailObject.Lifnr);
							objectLoaded.resolve();
						} else if (oEvent.mParameters.url.indexOf('$count') === -1) {
							objectNotFound.resolve();
						}
					});
				}

				busy();

				// $.when(objectNotFound).done(function () {
				// 	that.getRouter().navTo("verifyNotAvailable", {}, true);
				// 	notBusy();
				// });

				$.when(objectLoaded).done(function () {
					verifyObject = !!verifyObject ? verifyObject : oDataModel.getProperty("/VerifySet(LabelNum='" + labelNum + "',Werks='" + werks +
						"')");
					this.getView().bindElement("/VerifySet(LabelNum='" + labelNum + "',Werks='" + werks + "')");
					var binding = this.getView().getElementBinding();
					this._gDispCodTxt = verifyObject.DispCodTxt;
					this.byId('idCommentsFld').setMaxLength(255);

					if (!verifyObject.NegotiatedCostCurrency) {
						oDataModel.setProperty("NegotiatedCostCurrency", "CAD", binding);
					}

					this.byId("ArticlesTable").rerender();

					var aFilters = [
						new Filter("SEARCH_UPC_ART", "EQ", verifyObject.Matnr),
						new Filter("WERKS", "EQ", verifyObject.Werks)
					];

					if (verifyObject.Origin === "POS") {
						aFilters.push(new Filter("TRANS", "EQ", "02"));
					} else if (verifyObject.Origin === "COM") {
						aFilters.push(new Filter("TRANS", "EQ", "03"));
					}

					var aLoadDeferreds = [$.Deferred()]; //For ARTICLESet - 0

					var __reasonCode__ = verifyObject.ReasonCode,
						__status__ = verifyObject.Status,
						__editButton__,
						__originCode__ = verifyObject.Origin,
						reasonCodeSelect = this.byId("ReasonCodeSelect"),
						vendorSelect = this.byId("VendorSelect"),
						contextBinding = this.getView().getBindingContext(),
						labelObject = contextBinding.getObject(),
						articleModel = this.getModel("articleModel");

					if (__originCode__ === 'COM') {
						__editButton__ = true;
					} else {
						__editButton__ = false;
					}
					oDataModel.read("/ArticleProcessSet", {
						filters: aFilters,
						urlParameters: {
							"$expand": "reason_cdset"
						},
						success: function (oData) {
							if (oData.results[0]) {
								var oMesTyp = oData.results[0].MSG_TYPE;
								if (oMesTyp === "E") {
									var oMessage = oData.results[0].MESSAGE;
									notBusy();
									MessageToast.show(oMessage);
								} else {

									verifyViewModel.setProperty("/ReasonCodeSet", oData.results[0].reason_cdset.results);
									verifyViewModel.setProperty("/Article", oData.results[0]);
									var reasons = oData.results[0].reason_cdset.results;
									var dcVendor;
									for (var i = 0; i < reasons.length; i++) {
										if (reasons[i].REASON_CODE === __reasonCode__) {
											dcVendor = reasons[i].SHOW_DC_VENDORS;
											verifyModel.setProperty("/SHOW_DC_VENDORS", dcVendor);
											// verifyModel.refresh();

										}
									}

									// verifyModel.setProperty("ReasonCode", __reasonCode__, contextBinding);
									verifyModel.setProperty("/ReasonCode", __reasonCode__);

									//https://www.pivotaltracker.com/n/projects/1899945/stories/142509237
									//System does not allow any changes to reason code and only displays QOB Chargeback
									reasonCodeSelect.setEnabled(__reasonCode__ !== "30");

									var articleModelData = verifyViewModel.getProperty("/Article");

									articleModelData.Retail = articleModelData.PRICE;
									articleModelData.RtvLoc = labelObject.RTVLocation;
									articleModelData.RGA = labelObject.RGANum;
									articleModelData.Comments = labelObject.Comments;

									if (Number(articleModelData.VTWEG) === 20) {
										articleModelData.OnlineOnly = false;
									} else if (Number(articleModelData.VTWEG) === 40) {
										articleModelData.OnlineOnly = true;
									}

									var addtionalDetailModel = controller.getOwnerComponent().getModel('addtionalDetailModel');
									addtionalDetailModel.setProperty("retail", "$" + articleModelData.PRICE);

									var doneWithAdditionalDetails = function () {
										articleModel.setData({
											ReasonCode: __reasonCode__,
											Status: __status__,
											EditComment: __editButton__,
											OriginCode: __originCode__,
											Articles: [articleModelData]
										}, true);

										aLoadDeferreds[0].resolve();
									};

									if (verifyObject.Origin === "COM") {
										var params = {};

										params["LabelNum"] = labelObject.LabelNum;
										params["Store"] = labelObject.Werks;

										oDataModel.callFunction("/getCOMComments", {
											urlParameters: params,
											async: true,
											method: "GET",
											success: function (data) {
												var comments = "";

												data.results.forEach(function (item, i) {
													if (item.TDLINE !== "________________________________") {
														var comment = item.TDLINE;

														if (!comments) {
															comment = comment.replace("* ", "");
														} else {
															comment = comment.replace("* ", "\n\n");
														}

														comment = comment.replace(" *", "\n");

														comments = comments + comment;
													}
												});

												articleModelData.Comments = comments; //.substring(0, 255);

												doneWithAdditionalDetails();
											},
											error: doneWithAdditionalDetails
										});
									} else {
										doneWithAdditionalDetails();
									}
								}
							}
						},
						error: function (oError) {

							aLoadDeferreds[0].resolve();

							try {
								var paresedError = JSON.parse(oError.responseText).error.message.value;

								if (JSON.parse(oError.responseText).error.code.indexOf("YDRTV_ABORT") == -1) {
									MessageToast.show(paresedError);
								}
							} catch (err) {
								MessageToast.show(that.getResourceBundle().getText("InvalidArticleUpcNumber"));
							}
						}
					});

					aLoadDeferreds.push($.Deferred()); //For INFO_RECORDSet - 1
					aLoadDeferreds.push($.Deferred()); //For OrderValidateSet - 2

					verifyViewModel.setProperty("/VendorSet", []);
					verifyViewModel.setProperty("/POItemSet", []);

					if (verifyObject.OrderNumber && verifyObject.ReasonCode !== "30") {
						$.when(aLoadDeferreds[0]).done(function () {
							aFilters = [
								new Filter("MATNR", "EQ", verifyObject.Matnr),
								new Filter("VBELN", "EQ", verifyObject.OrderNumber)
							];

							oDataModel.read("/OrderValidateSet", {
								filters: aFilters,
								urlParameters: {
									"$expand": "OrderItemSet,POItemSet,POVendorSet"
								},
								success: function (oData) {
									var itemCost = 0.00;

									if (oData.results[0].POItemSet.results && oData.results[0].POItemSet.results[0]) {
										itemCost = oData.results[0].POItemSet.results[0].NETPR;
									}

									if (oData.results[0].POVendorSet.results) {
										verifyViewModel.setProperty("/VendorSet", oData.results[0].POVendorSet.results.map(function (vendor) {
											vendor.NETPR = itemCost;
											return vendor;
										}));
									}

									verifyViewModel.setProperty("/POItemSet", oData.results[0].POItemSet.results);

									aLoadDeferreds[2].resolve();
								},
								error: function (oError) {
									aLoadDeferreds[2].resolve();

									if (oError.responseText.indexOf('{"') !== -1) {
										var oErrorJSON = JSON.parse(oError.responseText);

										if (oErrorJSON.error.code.indexOf("YDRTV_ABORT") == -1) {
											MessageToast.show(oErrorJSON.error.message.value);
										}

									} else {
										MessageBox.show(
											JSON.parse(oError.responseText).error.message.value, {
												icon: sap.m.MessageBox.Icon.ERROR,
												title: "Error",
												actions: [sap.m.MessageBox.Action.OK]
											});
									}
								}
							});

						}.bind(this));
					} else {
						aLoadDeferreds[2].resolve();
					}

					$.when(aLoadDeferreds[0], aLoadDeferreds[2]).done(function () {
						aFilters = [
							new Filter("WERKS", 'EQ', verifyObject.Werks),
							new Filter("MATNR", 'EQ', verifyObject.Matnr),
							new Filter("MEINH", 'EQ', verifyObject.Meins)
						];

						oDataModel.read("/INFO_RECORDSet", {
							filters: aFilters,
							success: function (oData) {
								var reasonCodeSelect = __controller__.byId("ReasonCodeSelect");
								if (reasonCodeSelect) {
									if (reasonCodeSelect.getSelectedItem()) {
										var reasonCodeObject = reasonCodeSelect.getSelectedItem().getBindingContext().getObject();
									}
								}
								if (!reasonCodeObject) {
									reasonCodeObject = labelObject;
								}
								var vendorSelect = __controller__.byId("VendorSelect");

								var existingVendorSet = verifyViewModel.getProperty("/VendorSet");
								var dcFlag = verifyModel.getProperty("/SHOW_DC_VENDORS");
								var oModel = __controller__.getModel();

								var vendors = {},
									vendorSet = [];

								existingVendorSet.forEach(function (item, i) {
									if (!vendors[item.LIFNR]) {
										vendors[item.LIFNR] = item;
										vendorSet.push(item);
									}
								});

								oData.results.forEach(function (item, i) {
									if (!vendors[item.LIFNR]) {
										vendors[item.LIFNR] = item;
										vendorSet.push(item);
									}
								});

								verifyViewModel.setProperty("/VendorSet", vendorSet);
								if (reasonCodeObject) {
									// vendorSelect.getBinding("items").filter([new Filter("DC_FLAG", "EQ", reasonCodeObject.SHOW_DC_VENDORS)]);
									vendorSelect.getBinding("items").filter([new Filter("DC_FLAG", "EQ", dcFlag)]);

								}

								if (!vendorSelect.getItemAt(0)) {
									sap.m.MessageBox.show(__controller__.getResourceBundle().getText("NoVendorDetermined"), {
										icon: sap.m.MessageBox.Icon.ERROR,
										title: __controller__.getResourceBundle().getText("Error"),
										actions: [sap.m.MessageBox.Action.OK]
									});

									aLoadDeferreds[1].reject();
									return;
								}

								if (!__vendor__) {
									if (!vendorSelect.getItemAt(0)) {
										sap.m.MessageBox.show(__controller__.getResourceBundle().getText("NoVendorDetermined"), {
											icon: sap.m.MessageBox.Icon.ERROR,
											title: __controller__.getResourceBundle().getText("Error"),
											actions: [sap.m.MessageBox.Action.OK]
										});
										aLoadDeferreds[1].reject();
										return;

									} else {
										// var sPath = contextBinding.sPath;
										vendorSelect.setSelectedItem(vendorSelect.getItemAt(0).getKey());
										oModel.setProperty("Lifnr", vendorSelect.getItemAt(0).getKey(), contextBinding);
										oModel.setProperty("VENDOR", vendorSelect.getItemAt(0).data("vendor"), contextBinding);
										// verifyModel.setProperty("/Lifnr" + vendorSelect.getItemAt(0).getKey());
										// verifyModel.setProperty("/VENDOR", vendorSelect.getItemAt(0).data("vendor"));
										// verifyModel.setProperty("Lifnr", vendorSelect.getItemAt(0).getKey(), contextBinding);
										// verifyModel.setProperty("VENDOR", vendorSelect.getItemAt(0).data("vendor"), contextBinding);
									}
								} else {
									if
									// (vendors[controller.removeLeadingZeroes(__vendor__)] && vendors[controller.removeLeadingZeroes(__vendor__)].DC_FLAG ===
									// 	reasonCodeObject.SHOW_DC_VENDORS) {
									(vendors[controller.removeLeadingZeroes(__vendor__)] && vendors[controller.removeLeadingZeroes(__vendor__)].DC_FLAG ===
										dcFlag) {

										oModel.setProperty("Lifnr", vendorSelect.getItemAt(0).getKey(), contextBinding);
										oModel.setProperty("VENDOR", vendorSelect.getItemAt(0).data("vendor"), contextBinding);

										// verifyModel.setProperty("Lifnr", controller.padLeft(__vendor__), contextBinding);
										// verifyModel.setProperty("VENDOR", vendors[controller.removeLeadingZeroes(__vendor__)].VENDOR, contextBinding);
									} else {
										if (!vendorSelect.getItemAt(0)) {
											sap.m.MessageBox.show(__controller__.getResourceBundle().getText("NoVendorDetermined"), {
												icon: sap.m.MessageBox.Icon.ERROR,
												title: __controller__.getResourceBundle().getText("Error"),
												actions: [sap.m.MessageBox.Action.OK]
											});
											aLoadDeferreds[1].reject();
											return;
										} else {
											vendorSelect.setSelectedItem(vendorSelect.getItemAt(0));

											// verifyModel.setProperty("Lifnr", vendorSelect.getItemAt(0).getKey(), contextBinding);
											// verifyModel.setProperty("VENDOR", vendorSelect.getItemAt(0).data("vendor"), contextBinding);
											// verifyModel.setProperty("ItemCost", 0, contextBinding);
											// verifyModel.setProperty("NegotiatedCost", 0, contextBinding);
											oModel.setProperty("Lifnr", vendorSelect.getItemAt(0).getKey(), contextBinding);
											oModel.setProperty("VENDOR", vendorSelect.getItemAt(0).data("vendor"), contextBinding);
											oModel.setProperty("ItemCost", 0, contextBinding);
											oModel.setProperty("NegotiatedCost", 0, contextBinding);
											verifyObject.ItemCost = 0;
										}
									}
								}

								aLoadDeferreds[1].resolve();
							},
							error: function (oError) {
								aLoadDeferreds[1].reject();
							}
						});

					}.bind(this));

					var controller = this;

					$.when(aLoadDeferreds[1]).fail(function () {
						notBusy();
					}.bind(this));

					$.when(aLoadDeferreds[1]).done(function () {
						reasonCodeSelect = this.byId("ReasonCodeSelect");
						var oModel = __controller__.getModel();
						if (reasonCodeSelect.getSelectedItem()) {
							var reasonCodeObject = reasonCodeSelect.getSelectedItem().getBindingContext('verifyView').getObject();
						}
						var dcFlag = verifyModel.getProperty("/SHOW_DC_VENDORS");
						vendorSelect = this.byId("VendorSelect");
						if (reasonCodeObject) {
							// vendorSelect.getBinding("items").filter([new Filter("DC_FLAG", "EQ", reasonCodeObject.SHOW_DC_VENDORS)]);
							vendorSelect.getBinding("items").filter([new Filter("DC_FLAG", "EQ", dcFlag)]);
						}
						// var vendor = verifyModel.getProperty("VENDOR", contextBinding);
						var vendor = oModel.getProperty("VENDOR", contextBinding);

						oDataModel.read("/DefectAllowanceSet(VENDOR='" + vendor + "',MATNR='" + verifyObject.Matnr + "')", {
							success: function (oData) {
								verifyModel.setProperty("DefAllowance", oData.DEF_ALLOW_PERC, contextBinding);
							},
							error: function (oError) {
								try {
									var paresedError = JSON.parse(oError.responseText).error.message.value;

									if (JSON.parse(oError.responseText).error.code.indexOf("YDRTV_ABORT") == -1) {
										MessageToast.show(paresedError);
									}
								} catch (err) {
									MessageToast.show(controller.getResourceBundle().getText("CantGetDefAllowance"));
								}
							}
						});
					}.bind(this));

					//Story 138775259
					$.when(aLoadDeferreds[0], aLoadDeferreds[1]).done(function () {
						reasonCodeSelect = this.byId("ReasonCodeSelect");
						var oModel = this.getModel(),
							sPath = contextBinding.getPath();
						if (reasonCodeSelect.getSelectedItem()) {
							var reasonCodeObject = reasonCodeSelect.getSelectedItem().getBindingContext('verifyView').getObject();
						}
						var dcFlag = verifyModel.getProperty("/SHOW_DC_VENDORS");
						vendorSelect = this.byId("VendorSelect");
						if (reasonCodeObject) {
							// vendorSelect.getBinding("items").filter([new Filter("DC_FLAG", "EQ", reasonCodeObject.SHOW_DC_VENDORS)]);
							vendorSelect.getBinding("items").filter([new Filter("DC_FLAG", "EQ", dcFlag)]);

						}
						// var policyReturnCode = verifyModel.getProperty("POL_RTN_COD", contextBinding);
						var policyReturnCode = oModel.getProperty("POL_RTN_COD", contextBinding);

						// verifyModel.setProperty("NegotiatedCost", verifyObject.ItemCost, contextBinding);

						oModel.setProperty(sPath + "/NegotiatedCost", verifyObject.ItemCost);
						oModel.updateBindings(true);

						if (policyReturnCode === "01" || policyReturnCode === "03" || policyReturnCode === "08") {
							controller.getDispositionActionCodesList();
						} else {
							if ((Number(verifyObject.ItemCost) === 0 || isNaN(Number(verifyObject.ItemCost)))) {
								controller.loadItemCost(verifyObject);
							}
							if (__reasonCode__ !== "30") {
								controller.callPCT(verifyObject);
							}
						}

						notBusy();
					}.bind(this));
				}.bind(this));
			}

			this.getOwnerComponent().googleAnalyticUpdate({
				page: "Verify",
				site: this.siteId
			}); //Google Analytics
		},

		onNavBack: function () {
			sap.ui.getCore().getEventBus().publish("rtv.verify", "ClearMasterLisSelection");
			this.getView().getAggregation('content')[0].setEnableScrolling(false);
			this.getRouter().navTo("master", {}, true);
		},

		onArticlesColumnPress: function (oEvent) {
			this.getRouter().getTargets().display("articleDetail");
			this.getOwnerComponent().googleAnalyticUpdate({
				page: "Verify Additional Detail"
			}); //Google Analytics
		},

		onReasonCodeChange: function () {
			var reasonCodeSelect = this.byId("ReasonCodeSelect"),
				reasonCodeObject = reasonCodeSelect.getSelectedItem().getBindingContext('verifyView').getObject(),
				vendorSelect = this.byId("VendorSelect"),
				contextBinding = this.getView().getBindingContext(),
				verifyObject = contextBinding.getObject(),
				verifyModel = this.getGlobalModel();

			vendorSelect.getBinding("items").filter([new Filter("DC_FLAG", "EQ", reasonCodeObject.SHOW_DC_VENDORS)]);

			//We filter by DC flag so we need to set a new vendor
			if (vendorSelect.getItemAt(0)) {
				vendorSelect.setSelectedItem(vendorSelect.getItemAt(0));
				verifyModel.setProperty("Lifnr", vendorSelect.getItemAt(0).getKey(), contextBinding);
				verifyModel.setProperty("VENDOR", vendorSelect.getItemAt(0).data("vendor"), contextBinding);
			} else {
				sap.m.MessageBox.show(__controller__.getResourceBundle().getText("NoVendorDetermined"), {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: __controller__.getResourceBundle().getText("Error"),
					actions: [sap.m.MessageBox.Action.OK]
				});

				return;
			}

			// this.getModel("articleModel").setProperty("/ReasonCode", verifyObject.ReasonCode);
			this.getModel("articleModel").setProperty("/ReasonCode", reasonCodeObject.REASON_CODE);
			verifyObject.ReasonCode = reasonCodeObject.REASON_CODE;

			this.loadItemCost(verifyObject);

			this.getModel("articleModel").setProperty("/Articles/0/RGA", "");
			verifyModel.setProperty("RGANum", "", contextBinding);

			this.callPCT(verifyObject);
		},

		loadItemCost: function (verifyObject) {
			var verifyModel = this.getGlobalModel(),
				verifyViewModel = this.getModel("verifyView"),
				article = verifyViewModel.getProperty("/Article"),
				contextBinding = this.getView().getBindingContext(),
				// vendor = verifyObject.Lifnr,
				vendorSelect = __controller__.byId("VendorSelect"),
				selectedVendor = vendorSelect.getSelectedItem(),
				item_cost;

			if (selectedVendor) {
				item_cost = selectedVendor.data("itemCost");
			}

			verifyModel.setProperty("ItemCost", item_cost, contextBinding);
			// verifyModel.setProperty("ItemCost", item_cost);
			// verifyModel.setProperty("NegotiatedCost", item_cost);
			verifyModel.setProperty("NegotiatedCost", item_cost, contextBinding);

			var fnItemCostIsMissing = function () {
				sap.m.MessageBox.show(__controller__.getResourceBundle().getText("ItemCostIsMissingPleaseContactHelpdesk"), {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: __controller__.getResourceBundle().getText("Error"),
					actions: [sap.m.MessageBox.Action.OK]
				});
			};

			//ItemCost is missing
			if (Number(item_cost) === 0 || isNaN(Number(item_cost))) {
				if (verifyObject.Origin === "POS") {
					if (article.MTART === "Z001") {
						fnItemCostIsMissing();
						return;
					}
				} else if (verifyObject.Origin === "COM") {
					if (article.MTART === "Z001") {
						if (verifyObject.ReasonCode === "31") {
							//"Cost comes from MAC which would never be zero. If it does come as $0, allow user to process"
							return;
						} else {
							fnItemCostIsMissing();
							return;
						}
					} else if (article.MTART === "Z003") {
						//System allows user to Verify the label although cost is = $0
						return;
					}
				}
			}
		},

		onVendorChange: function (evt) {
			var contextBinding = this.getView().getBindingContext(),
				sPath = contextBinding.sPath,
				verifyObject = contextBinding.getObject(),
				verifyModel = this.getGlobalModel();

			var article = verifyObject.Matnr,
				vendor = evt.getParameter("selectedItem").getBindingContext("verifyView").getObject().VENDOR,
				oLifnr = evt.getParameter("selectedItem").getBindingContext("verifyView").getObject().LIFNR,
				that = this;

			verifyModel.setProperty(sPath + "/VENDOR", vendor);
			verifyModel.setProperty(sPath + "/Lifnr", oLifnr);
			verifyObject.Lifnr = oLifnr;
			verifyObject.VENDOR = vendor;

			this.loadItemCost(verifyObject);

			verifyModel.read("/DefectAllowanceSet(VENDOR='" + vendor + "',MATNR='" + article + "')", {
				success: function (oData) {
					verifyModel.setProperty(sPath + "DefAllowance", oData.DEF_ALLOW_PERC);
				},
				error: function (oError) {
					try {
						var paresedError = JSON.parse(oError.responseText).error.message.value;

						if (JSON.parse(oError.responseText).error.code.indexOf("YDRTV_ABORT") == -1) {
							MessageToast.show(paresedError);
						}
					} catch (err) {
						MessageToast.show(that.getResourceBundle().getText("CantGetDefAllowance"));
					}
				}
			});

			this.callPCT(verifyObject);
		},

		callPCT: function (verifyObject) {
			var contextBinding = this.getView().getBindingContext();
			if (!verifyObject) {
				verifyObject = contextBinding.getObject();
			}
			var controller = this,
				sPath = contextBinding.sPath,
				oDataModel = this.getModel(),
				// verifyModel = this.getModel("verify"),
				oPCTModel = this.getGlobalModel("oPCTModel"),
				verifyViewModel = this.getModel("verifyView"),
				articelData = verifyViewModel.getProperty("/Article");
			this._gPath = sPath;

			if (Number(verifyObject.ItemCost) === 0 || isNaN(Number(verifyObject.ItemCost))) {
				var proceed = false;

				//COM	Z001 (DTH)	No data		Return to DC  	"Cost comes from MAC which would never be zero If it does come as $0, allow user to process"
				if (verifyObject.ReasonCode === "031" && verifyObject.Origin === "COM" && articelData.MTART === "Z001") {
					proceed = true;
				}
				//COM	Z003
				if (verifyObject.Origin === "COM" && articelData.MTART === "Z003") {
					proceed = true;
				}

				if (verifyObject.DispCod === "00" && verifyObject.POL_RTN_COD === "06") {
					proceed = true;
					if (verifyObject.Lifnr === "" && this.getModel('verifyView').getProperty('/VendorSet/0/LIFNR') !== undefined) {
						verifyObject.Lifnr = this.getModel('verifyView').getProperty('/VendorSet/0/LIFNR');
					}
				}
				if (!proceed) {
					notBusy();
					return;
				}
			}

			if (!articelData) {
				notBusy();
				return;
			}

			var
				sClass = articelData.CLASS,
				sSubClass = articelData.SUBCLASS,
				sDept = articelData.DEPT,
				sRtvType = articelData.RTV_TYPE,
				sRegio = 'ON',
				sLand1 = 'CA';

			var aFilters = [
				new Filter("MATNR", "EQ", verifyObject.Matnr),
				new Filter("WERKS", "EQ", verifyObject.Werks),
				new Filter("ORIGIN_COD", "EQ", verifyObject.Origin),
				new Filter("MEINH", "EQ", verifyObject.Meins),
				new Filter("EAN11", "EQ", verifyObject.UPC),
				new Filter("REASON_CODE", "EQ", verifyObject.ReasonCode),
				new Filter("LIFNR", "EQ", verifyObject.Lifnr),
				new Filter("CLASS", "EQ", sClass),
				new Filter("SUBCLASS", "EQ", sSubClass),
				new Filter("LAND1", "EQ", sLand1),
				new Filter("REGIO", "EQ", sRegio),
				new Filter("DEPT", "EQ", sDept),
				new Filter("RTV_TYPE", "EQ", sRtvType)
			];

			if (verifyObject.ReasonCode === "30" || verifyObject.ReasonCode === "20") {
				aFilters.push(new Filter("ITEM_COST", "EQ", Number(verifyObject.NegotiatedCost)));
				aFilters.push(new Filter("CURRENCY", "EQ", verifyObject.NegotiatedCostCurrency));
			} else {
				aFilters.push(new Filter("ITEM_COST", "EQ", Number(verifyObject.ItemCost)));
				aFilters.push(new Filter("CURRENCY", "EQ", verifyObject.Currency));
			}

			busy();

			oPCTModel.read("/PCT_DETAILSet", {
				filters: aFilters,
				urlParameters: {
					"$expand": "DISP_ACT_CODESet,LABEL_NOSet"
				},
				success: function (oData) {
					notBusy();

					oDataModel.setProperty(sPath + "/DispCodTxt", oData.results[0].DISP_COD_TXT);
					oDataModel.setProperty(sPath + "/DispCod", oData.results[0].DISP_COD);

					verifyViewModel.checkUpdate();

					controller.setModel(new JSONModel(oData.results[0]), "PCTResult");
					controller.setModel(new JSONModel(oData.results[0].DISP_ACT_CODESet.results), "dispositionActionCodesModel");
				},
				error: function (oError) {
					notBusy();

					oDataModel.setProperty(sPath + "/DispCodTxt", "");
					oDataModel.setProperty(sPath + "/DispCod", "");

					verifyViewModel.checkUpdate();

					if (oError.responseText.indexOf('{"') !== -1) {
						var oErrorJSON = JSON.parse(oError.responseText);
						MessageBox.show(
							oErrorJSON.error.message.value, {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "Error",
								actions: [sap.m.MessageBox.Action.OK]
							});

					} else if (oError.responseText.indexOf("<html>") === 0) {
						MessageBox.show(
							oError.responseText, {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "Error",
								actions: [sap.m.MessageBox.Action.OK]
							});
					} else {
						MessageBox.show(
							JSON.parse(oError.responseText).error.message.value, {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "Error",
								actions: [sap.m.MessageBox.Action.OK]
							});
					}
				}
			});
		},

		vendorText: function (code, text) {
			if (code) {
				return Number(code) + " - " + text;
			}
		},
		
		formatOrder: function (pscFlag, comVbeln, refVbeln) {
			var value = "";
			if (pscFlag === "X"){
				value = refVbeln;
			}
			else{
				value = comVbeln;
			}
			
			
			var valueSearch = value ? value.replace(/^0+/, "") : "";
			return valueSearch;
		},

		removeLeadingZeroes: function (value) {
			var valueSerach = value ? value.replace(/^0+/, "") : "";
			return valueSerach;
		},

		padLeft: function (value) {
			return !!value ? jQuery.sap.padLeft(value, "0", 10) : "";
		},

		itemCost: function (cost) {
			if (cost) {
				if (parseInt(cost.split(".")[1]) === 0) {
					return parseInt(cost);
				} else {
					return cost;
				}
			}
		},

		defAllowance: function (defAllowance) {
			return Number(defAllowance) > 0 ? "Yes" : "No";
		},

		onArticleNumberPress: function (oEvent) {
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				jQuery.sap.require("jquery.sap.storage");

				var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);

				oStorage.put("navBackFromALU", {
					"navBackFromALU": true
				});

				var contextBinding = this.getView().getBindingContext(),
					verifyObject = contextBinding.getObject();
				// verifyModel = this.getModel("verify"),
				// verifyViewModel = this.getModel("verifyView"),
				// articelData = verifyViewModel.getProperty("/Article");

				// var labelModel = this.getModel("labelModel");
				var article = verifyObject.Matnr;

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
							var storid = verifyObject.Werks;

							var action = "Y_LOOKUP&/product/" + storid + "/" + article + "";
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

		onRTVDetail: function (oEvent) {
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				var contextBinding = this.getView().getBindingContext(),
					verifyObject = contextBinding.getObject(),
					verifyModel = this.getModel("verify"),
					verifyViewModel = this.getModel("verifyView"),
					articelData = verifyViewModel.getProperty("/Article");

				var labelModel = this.getModel("labelModel");
				var labelNum = verifyObject.LabelNum;

				jQuery.sap.require("jquery.sap.storage");

				var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.session);
				oStorage.put("rtvNavBack", window.location.href);
				var that = this;
				var dialog = new Dialog({
					title: this.getResourceBundle().getText("Warning"),
					type: 'Message',
					state: 'Warning',
					content: new Text({
						text: this.getResourceBundle().getText("toRTV")
					}),
					beginButton: new Button({
						text: this.getResourceBundle().getText("Yes"),
						press: function () {
							dialog.close();

							var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
							var storid = that.siteId;
							var action = "display&/object/" + storid + "/" + labelNum + "";
							oCrossAppNavigator.toExternal({
								target: {
									semanticObject: "YSO_VIEWRTV",
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

		onNegotiatedCostLiveChange: function (evt) {
			var negCostFld = evt.getSource();
			var value = evt.getParameter("value");
			value = value.replace(/[^\d.]/g, "");
			if (value.indexOf(".") > -1) {
				value = value.split(".")[0] + "." + value.split(".")[1].substring(0, 2);
			}
			// var sPath = evt.getSource().getBindingContext().getPath(),
			//     oModel = this.getModel();

			// negCostFld.getBindingContext("verify").getObject().NegotiatedCost = value;
			negCostFld.getBindingContext().getObject().NegotiatedCost = value;
			negCostFld.updateDomValue(value);
			negCostFld.setValueState(ValueState.None);
			// oModel.setProperty(sPath + "/NegotiatedCost", value);   
		},

		priceErrorMessage: function (msg, NagotiatedCostFld) {
			sap.m.MessageBox.show(
				msg, {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Error",
					actions: [sap.m.MessageBox.Action.OK]
				});
		},

		showInfoDialog: function (dispositionActionArray) {
			var controller = this;

			sap.m.MessageBox.show(
				controller.getResourceBundle().getText("SystemHasDeterminedThisItemToBeScrappedDueToHDVendorPolicies"), {
					icon: sap.m.MessageBox.Icon.INFORMATION,
					title: this.getResourceBundle().getText("Information"),
					actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
					onClose: function (oAction) {
						if (oAction === sap.m.MessageBox.Action.OK) {
							controller.onVerify(oAction, dispositionActionArray[0].DISP_ACT_COD);
						}
					}
				});
		},

		showDialog: function (dispositionActionArray, controllerReference) {
			var selectedDispActionCode;
			var radioButtonCodeArray = [];
			var radioButtonTextArray = [];
			var radioButtonsArray = [];
			var length = dispositionActionArray.length;
            
            if(this._gPath && this._gPath !=""){
            	var sNewText = this.getModel().getData(this._gPath).DispCodTxt;
            	this._gDispCodTxt = sNewText;
            }
			//Create dialog
			var standardDialog = new sap.m.Dialog({
				content: [
					new sap.ui.core.HTML({
						content: '<p id="p1" style="margin:0.5rem; text-align: center; font-size: .875rem;">' + this._gDispCodTxt + '</p>'
					})
				],
				title: controllerReference.getResourceBundle().getText("SelectDispositionAction"),
				type: sap.m.DialogType.Standard,
				leftButton: new sap.m.Button({
					text: controllerReference.getResourceBundle().getText("Submit"),
					press: function () {
						for (var j = 0; j < radioButtonsArray.length; j++) {
							if (radioButtonsArray[j].getSelected()) {
								selectedDispActionCode = radioButtonCodeArray[j];
							}
						}
						standardDialog.close();
						controllerReference.onVerify(undefined, selectedDispActionCode);
					}
				}),

				rightButton: new sap.m.Button({
					text: controllerReference.getResourceBundle().getText("Cancel"),
					press: function () {
						standardDialog.close();
					}
				})
			});

			for (var i = 0; i < length; i++) {
				radioButtonCodeArray.push(dispositionActionArray[i].DISP_ACT_COD);
				radioButtonTextArray.push(dispositionActionArray[i].DISP_ACT_COD_TXT);

				radioButtonsArray[i] = new sap.m.RadioButton({
					text: radioButtonTextArray[i]
				});

				standardDialog.addContent(radioButtonsArray[i]);
			}
			radioButtonsArray[0].setSelected(true);
			standardDialog.open();
		},

		onVerify: function (oEvent, selectedDispositionActionCode) {
			var verifyViewModel = this.getModel("verifyView"),
				verifyModel = this.getModel(),
				labelObject = this.getView().getBindingContext().getObject(),
				article = this.getModel("articleModel").getData().Articles[0],
				controller = this,
				pctObject = this.getModel("PCTResult") ? this.getModel("PCTResult").getData() : {},
				newObject = verifyModel.createEntry("VfyLabelDtlSet").getObject(),
				reasonCodeSet = verifyViewModel.getProperty("/ReasonCodeSet"),
				oReasonCodeSelect = this.getView().byId("ReasonCodeSelect"),
				oReasonCode = oReasonCodeSelect.getSelectedItem().getKey();

			labelObject.ReasonCode = oReasonCode;

			if (this.byId('idEditCOM').getEnabled() && this.byId('idEditCOM').getVisible()) {
				article.Comments = "";
			}

			if (labelObject.ReasonCode === '20' || labelObject.ReasonCode === '30') {
				var minPrice, maxPrice, reasonCodeObject, message;

				reasonCodeSet.some(function (object) {
					if (object.REASON_CODE === labelObject.ReasonCode) {
						reasonCodeObject = object;
						return true;
					}
				});

				if (!reasonCodeObject) return;

				var qty = labelObject.Menge,
					cost = (labelObject.ReasonCode === '20' || labelObject.ReasonCode === '30') ? labelObject.NegotiatedCost : labelObject.ItemCost,
					priceFromUi = Number(qty) * Number(cost);

				if (labelObject.NegotiatedCostCurrency === "CAD") {
					minPrice = reasonCodeObject.MIN_PRICE_CAD;
					maxPrice = reasonCodeObject.MAX_PRICE_CAD;
				} else {
					minPrice = reasonCodeObject.MIN_PRICE_USD;
					maxPrice = reasonCodeObject.MAX_PRICE_USD;
				}

				if (Number(minPrice) > priceFromUi) {
					message = this.getResourceBundle().getText("ChargebackMinimumHasNotBeenMet", [minPrice, "CAD"]);
					this.priceErrorMessage(message);
					return;
				} else if (Number(maxPrice) < priceFromUi) {
					message = this.getResourceBundle().getText("ChargebackMaximumHasNotBeenMet", [maxPrice, "CAD"]);
					this.priceErrorMessage(message);
					return;
				}
			}

			if (!selectedDispositionActionCode) {
				var dispositionActionArray = this.getModel("dispositionActionCodesModel").getData();

				if (dispositionActionArray.length === 1) {
					this.showInfoDialog(dispositionActionArray, this);
					return;
				}
				if (dispositionActionArray.length > 1) {
					this.showDialog(dispositionActionArray, this, this);
					return;
				}
			} else {
				newObject.DISP_ACT_COD = selectedDispositionActionCode;
			}

			busy();

			function copyProperties(newObject, oldObject) {
				for (var prop in newObject) {
					switch (prop) {
					case '__metadata':
					case '_bCreate':
					case '__proto__':
						delete newObject[prop];
						continue;
					default:
						if (oldObject.hasOwnProperty(prop)) {
							newObject[prop] = oldObject[prop];
						} else if (oldObject.hasOwnProperty(controller.MAPPING[prop])) {
							newObject[prop] = oldObject[controller.MAPPING[prop]];
						}
					}
				}
			};

			copyProperties(newObject, pctObject);
			copyProperties(newObject, labelObject);
			var oCost = newObject.ITEM_COST.toString();
			newObject.ITEM_COST = oCost;
			//START changes for bug#146018843
			if (!$.isEmptyObject(pctObject)) {
				newObject.POL_RTN_COD = pctObject.POL_RTN_COD;
			}
			//END changes for bug#146018843
			newObject.RTV_LOC = article.RtvLoc;
			newObject.COMMENTS = article.Comments;

			if (labelObject.ReasonCode === '20' || labelObject.ReasonCode === '30') {
				newObject.RGA_NUM = labelObject.RGANum;
			} else {
				newObject.RGA_NUM = article.RGA;
			}

			verifyModel.create("/VfyLabelDtlSet", newObject, {
				success: function (oData, response) {
					notBusy();

					sap.ui.getCore().getEventBus().publish("rtv.verify", "RefreshMasterList");

					controller.onNavBack();
				},
				error: function (oError) {
					notBusy();

					try {
						var oErrorJSON = JSON.parse(oError.responseText);
						var oErrorCode = oErrorJSON.error.code;
						MessageBox.show(
							oErrorJSON.error.message.value, {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "Error",
								actions: [sap.m.MessageBox.Action.OK],
								onClose: function (oAction) {
									if (oErrorCode === "Y_DSC_RTV/106") {
										sap.ui.getCore().getEventBus().publish("rtv.verify", "RefreshMasterList");
										controller.onNavBack();
									}
								}
							});
					} catch (exc) {
						var oErrorJSON = JSON.parse(oError.responseText);
						MessageBox.show(
							exc, {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "Error",
								actions: [sap.m.MessageBox.Action.OK]
							});
					}
				}
			});
		},

		onDataChange: function (oEvent) {
			var oRgaId = this.byId("idVerRGA").getId(),
				oNegCst = this.byId("idNgtCst").getId(),
				oFldID = oEvent.getSource().getId(),
				sPath = oEvent.getSource().getBindingContext().getPath(),
				oModel = this.getModel(),
				oValue = oEvent.getParameters().newValue;
			if (oFldID === oRgaId) {
				oModel.setProperty(sPath + "/RGANum", oValue);
				oModel.updateBindings(true);
			} else if (oFldID === oNegCst) {
				oModel.setProperty(sPath + "/NegotiatedCost", oValue);
				oModel.updateBindings(true);
			}
			this.callPCT();
			this.getModel("verifyView").checkUpdate();
		},

		getDispositionActionCodesList: function () {
			var pctModel = this.getModel("oPCTModel"),
				verifyObject = this.getView().getBindingContext().getObject(),
				aFilters = [
					new Filter("WERKS", 'EQ', verifyObject.Werks),
					new Filter("MATNR", 'EQ', verifyObject.Matnr),
					new Filter("MEINS", 'EQ', verifyObject.Meins),
					new Filter("DISP_COD", 'EQ', verifyObject.DispCod),
					new Filter("RSN_COD", 'EQ', verifyObject.ReasonCode),
					new Filter("DEF_ALLOW_PERC", 'EQ', verifyObject.DefAllowance)
				];

			busy();

			pctModel.read("/DISP_ACT_CODESet", {
				filters: aFilters,
				success: function (oData) {
					notBusy();

					__controller__.setModel(new JSONModel(oData.results), "dispositionActionCodesModel");
				},
				error: function (oError) {
					notBusy();

					if (oError.responseText.indexOf('{"') !== -1) {
						var oErrorJSON = JSON.parse(oError.responseText);
						MessageBox.show(
							oErrorJSON.error.message.value, {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "Error",
								actions: [sap.m.MessageBox.Action.OK]
							});

					} else if (oError.responseText.indexOf("<html>") === 0) {
						MessageBox.show(
							oError.responseText, {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "Error",
								actions: [sap.m.MessageBox.Action.OK]
							});
					} else {
						MessageBox.show(
							JSON.parse(oError.responseText).error.message.value, {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "Error",
								actions: [sap.m.MessageBox.Action.OK]
							});
					}
				}
			});
		},
		onEditCOMComment: function (oEvent) {
			var txtComment = this.byId('idCommentsFld');
			this.getModel('articleModel').getData().OriginCode = 'xyz';
			oEvent.getSource().setEnabled(false);
			txtComment.setMaxLength(255);
			txtComment.focus();
			txtComment.setEnabled(true);
			txtComment.setValue("");
		},
		_AuthorizationVerifyAccess: function (labelNum, werks) {
			var oAuthModel = this.getOwnerComponent().getModel("oAuthModel"),
				oData = oAuthModel.getData(),
				verifyButton = this.byId("VerifyButton"),
				oText = this.getResourceBundle().getText("verifyTitle"),
				oTitle,
				labelNum = labelNum,
				werks = werks,
				oDetailPage = this.getView().byId("VerifyPage");
			if (oData) {
				if(oData.Verify === "Y"){
					verifyButton.setVisible(true);
				}
				// verifyButton.setVisible(
				// 	oData.results.some(function (item) {
				// 		return (item.Verify === "Y");
				// 	})
				// );
				if (oData.PSC_User == 'Y') {
					var oDataModel = this.getGlobalModel(),
						verifyObject = oDataModel.getProperty("/VerifySet(LabelNum='" + labelNum + "',Werks='" + werks + "')");
					if (verifyObject) {
						var oText = this.getResourceBundle().getText("verifyTitle"),
							oTitle = oText + '-' + verifyObject.Werks;
						oDetailPage.setTitle(oTitle);
					}
				}
			} else {
				this._AuthorizationAccess(labelNum, werks);
			}

		},
		_AuthorizationAccess: function (labelNum, werks) {
			var oModel = this.getModel();
			var verifyButton = this.byId("VerifyButton"),
				labelNum = labelNum,
				werks = werks;
			var oAuthModel = this.getOwnerComponent().getModel("oAuthModel");
			var that = this,
				oText = this.getResourceBundle().getText("verifyTitle"),
				oTitle,
				oDetailPage = this.getView().byId("VerifyPage");
			sap.ui.core.BusyIndicator.show();
			oModel.read("/UserAuthSet", {
				success: function (oData, response) {
					oAuthModel.setData(oData);
					verifyButton.setVisible(
						oData.results.some(function (item) {
							return (item.Verify === "Y");
						})
					);
					if (oData.results[0].PSC_User == 'Y') {
						var oDataModel = that.getGlobalModel(),
							verifyObject = oDataModel.getProperty("/VerifySet(LabelNum='" + labelNum + "',Werks='" + werks + "')");
						if (verifyObject) {
							var oText = that.getResourceBundle().getText("verifyTitle"),
								oTitle = oText + '-' + verifyObject.Werks;
							oDetailPage.setTitle(oTitle);
						}
					}
					sap.ui.core.BusyIndicator.hide();
				},
				error: function (oError) {
					that.createRTVBtn.setVisible(false);
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},
		MAPPING: {
			"REASON_CODE": "ReasonCode",
			"LIFNR": "Lifnr",
			"DEF_ALLOW_PERC": "DefAllowance",
			"LABEL_NUM": "LabelNum",
			"CURRENCY": "Currency",
			"MEINS": "Meins",
			"MENGE": "Menge",
			"ITEM_COST": "ItemCost",
			"NEGOTIATED_COST": "NegotiatedCost",
			"NEGOTIATED_CUKY": "NegotiatedCostCurrency",
			"RGA_NUM": "RGANum",
			"WERKS": "Werks",
			"LABEL_COLOR": "LabelColor"
		}
	});
});