/*global location*/
sap.ui.define([
	"YRTV_ONE_TILE/YRTV_ONE_TILE/controller/Worklist/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"YRTV_ONE_TILE/YRTV_ONE_TILE/model/Worklist/formatter",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Text",
	"sap/ui/core/format/DateFormat"
], function (BaseController, JSONModel, History, formatter, Dialog, Button, Text, DateFormat) {
	"use strict";
	var sGlobalPath;

	return BaseController.extend("YRTV_ONE_TILE.YRTV_ONE_TILE.controller.Worklist.VendorDetails", {
			formatter: formatter,

			/**
			 * Called when a controller is instantiated and its View controls (if available) are already created.
			 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
			 * @memberOf com.hd.rtvworklist.view.view.VendorDetails
			 */
			DateFormat: DateFormat.getDateInstance({
				pattern: "MM/dd/yyyy"
			}),

			Date2NumFormat: DateFormat.getDateInstance({
				pattern: "yyyyMMdd"
			}),

			onInit: function (oEvent) {
				this.getRouter().getRoute("vendordetails").attachPatternMatched(this._onVendorDetailMatched, this);
				this.refreshAwaiting = false;

			},

			onEmailToChange: function (evt) {
				var emailToFld = evt.getSource();
				var enteredEmailTo = emailToFld.getValue();
				var emailRegex = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
				var odataWorklistmodel = this.getView().getModel("odataWorklistmodel");
				if (enteredEmailTo.length !== 0) {
					if (emailRegex.test(enteredEmailTo)) {
						emailToFld.setValueState("None");
						odataWorklistmodel.setProperty("/emailContent/SendEnabled", true, emailToFld.getBindingContext("odataWorklistmodel"));
					} else {
						emailToFld.setValueState("Error");
						odataWorklistmodel.setProperty("/emailContent/SendEnabled", false, emailToFld.getBindingContext("odataWorklistmodel"));
					}
				} else {
					emailToFld.setValueState("Error");
					odataWorklistmodel.setProperty("/emailContent/SendEnabled", false, emailToFld.getBindingContext("odataWorklistmodel"));
				}
			},

			onEmailCopyChange: function (evt) {
				var emailCopyFld = evt.getSource();
				var emailToFld = sap.ui.getCore().byId("carton--EmailTo");
				var enteredEmailCopy = emailCopyFld.getValue();
				var emailRegex = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
				var emailArray = enteredEmailCopy.split(";");
				var odataWorklistmodel = this.getView().getModel("odataWorklistmodel");
				var validState = !emailArray.some(function (element, idx, array) {
					if (element.trim().length > 0) {
						if (emailRegex.test(element.trim())) {
							return false;
						} else {
							return true;
						}
					}
				});
				emailCopyFld.setValueState(validState ? "None" : "Error");
				odataWorklistmodel.setProperty("/emailContent/SendEnabled", validState && emailToFld.getValue().length !== 0, emailCopyFld.getBindingContext(
					"odataWorklistmodel"));

			},

			onEmailSendPress: function () {
				var that = this;
				sap.ui.core.BusyIndicator.show();
				var oLabelModel = this.getOwnerComponent().getModel();
				var viewBindingContext = this.getView().getBindingContext();
				var sWorksheet = viewBindingContext.getObject().WORKSHEET;
				var sData = this.getView().getModel("odataWorklistmodel").getData();
				var emailContent = sData.emailContent;
				var oUrlParameters = {
					"Function": "02",
					"Worksheet": sWorksheet,
					"EmailTo": emailContent.EmailTo,
					"EmailCc": emailContent.EmailCc,
					"EmailSubject": emailContent.EmailSubject,
					"EmailText": emailContent.EmailText.replace(/(?:\r\n|\r|\n)/g, '<br>'),
					"LABEL_NUMBSet": []
				};
				var vendorDetailTable = this.getView().byId("idVendorDetailsTable");
				var tableData = vendorDetailTable.getItems();
				var oLabelNum;

				for (var i = 0; i < tableData.length; i++) {
					oLabelNum = vendorDetailTable.getItems()[i].getCells()[4].getText();
					oUrlParameters.LABEL_NUMBSet.push({
						"LABEL_NUM": oLabelNum
					});

				}

				var sPath = "/WLWS_EMAILSet";
				oLabelModel.create(sPath, oUrlParameters, {
					success: function (oData) {
						that._emailPopUp.close();
						that._emailPopUp.setBusy(false);
						that.refreshAwaiting = true;
						sap.ui.core.BusyIndicator.hide();
					},
					error: function (oError) {
						that._emailPopUp.setBusy(false);
						that.refreshAwaiting = false;
						sap.ui.core.BusyIndicator.hide();
						sap.m.MessageBox.show(
							JSON.parse(oError.responseText).error.message.value, {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "Error",
								actions: [sap.m.MessageBox.Action.OK],
								onClose: function (oAction) {
									if ((JSON.parse(oError.responseText).error.code).indexOf("YDRTV_ABORT") === 0) {
										var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
										oCrossAppNavigator.toExternal({
											target: {
												semanticObject: "#"
											}
										});
									}
								}
							});
					}
				});

			},
			onResendPress: function () {
				// var that = this;
				if (!this._emailPopUp) {
					this._emailPopUp = sap.ui.xmlfragment("carton", "YRTV_ONE_TILE.YRTV_ONE_TILE.view.Worklist.ReSendEmail", this);
					this.getView().addDependent(this._emailPopUp);

					var emailToFld = sap.ui.getCore().byId("carton--EmailTo");
					var emailCopyFld = sap.ui.getCore().byId("carton--EmailCopy");
					if (emailToFld) {
						if (emailToFld.refreshDataState) {
							emailToFld.refreshDataState = $.noop;
						}
					}
					if (emailCopyFld) {
						if (emailCopyFld.refreshDataState) {
							emailCopyFld.refreshDataState = $.noop;
						}
					}
				}
				this._getEmailContent();
				this._emailPopUp.open();

			},

			_getEmailContent: function () {
				var that = this;

				var oLabelModel = this.getOwnerComponent().getModel();
				var odataWorklistmodel = this.getView().getModel("odataWorklistmodel");
				var viewBindingContext = this.getView().getBindingContext();
				var sWorksheet = viewBindingContext.getObject().WORKSHEET;
				var vendorDetailTable = this.getView().byId("idVendorDetailsTable");
				var tableData = vendorDetailTable.getItems();

				var oUrlParameters = {
					"WERKS": "'" + this.siteID + "'",
					"FUNCTION": "'01'",
					"WORKSHEET": "'" + sWorksheet + "'",
					"EMAILTO": "' '",
					"EMAILCC": "' '",
					"EMAILTEXT": "' '",
					"LABEL": "'" + tableData[0].getCells()[4].getText() + "'"
				};

				var sPath = "/RESEND_WORKSHEET";

				oLabelModel.read(sPath, {
					urlParameters: oUrlParameters,
					success: function (oData) {
						oData.EmailText = oData.EmailText.replace(new RegExp('<BR>', 'g'), "\n");
						oData.EmailText = oData.EmailText.replace(new RegExp('<p>', 'g'), "\n");
						oData.EmailText = oData.EmailText.replace(new RegExp('</p>', 'g'), "\n");

						if (oData.EmailTo.length !== 0) {
							oData.SendEnabled = true;
						} else {
							oData.SendEnabled = false;
						}
						odataWorklistmodel.setProperty("/emailContent", oData, viewBindingContext);
						that._emailPopUp.setModel("odataWorklistmodel");
						that._emailPopUp.open();
						// that._emailPopUp.setBusy(false);
					},
					error: function (oError) {
						that._emailPopUp.setBusy(false);
						sap.m.MessageBox.show(
							JSON.parse(oError.responseText).error.message.value, {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "Error",
								actions: [sap.m.MessageBox.Action.OK],
								onClose: function (oAction) {
									that._emailPopUp.close();
									if ((JSON.parse(oError.responseText).error.code).indexOf("YDRTV_ABORT") === 0) {
										var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
										oCrossAppNavigator.toExternal({
											target: {
												semanticObject: "#"
											}
										});
									}
								}
							});
					}
				});
			},

			onEmailCancelPress: function () {
				var emailToFld = sap.ui.getCore().byId("carton--EmailTo");
				var emailCopyFld = sap.ui.getCore().byId("carton--EmailCopy");
				emailToFld.setValueState("None");
				emailCopyFld.setValueState("None");
				this._emailPopUp.close();
			},

			_onVendorDetailMatched: function (oEvent) {
				sap.ui.core.BusyIndicator.show();
				this.getView().getAggregation('content')[0].getAggregation('pages')[0].scrollTo(0);
				this._AuthorizationVerifyAccess();
				var oModel = this.getOwnerComponent().getModel();
				oModel.updateBindings(true);
				var oParameters = oEvent.getParameters();
				var sPath = oParameters.arguments.vendor;
				var oLabel = this.getOwnerComponent().getModel("WorkListi18n").getResourceBundle().getText("labelsTrans");
				var vendorDetailTable = this.getView().byId("idVendorDetailsTable");
				sGlobalPath = sPath;
				var oCurrentData = oModel.getProperty("/" + sPath);
				if (oCurrentData) {
					this.getView().bindElement({
						path: "/" + sPath
					});
					var oRTVConnectFlag = oCurrentData.RTVCONNECT_VENDOR;
					var oWrkSheetStatus = oCurrentData.WORKSHEET_STATUS;
					this.fillLabelColor(oRTVConnectFlag, oWrkSheetStatus);
					sap.ui.core.BusyIndicator.hide();
				} else {

					this.getAwaitingData("/" + sPath);
				}
			},

			getAwaitingData: function (sPath) {
				var oModel = this.getOwnerComponent().getModel();
				var that = this;
				oModel.read(sPath, {
					urlParameters: {
						"$expand": "WLAwaiting_DetailSet"
					},
					success: function (oData, oResponse) {
						sap.ui.core.BusyIndicator.hide();
						oModel.bindContext(sGlobalPath);
						that.getView().bindElement({
							path: "/" + sGlobalPath
						});

						var oRTVConnectFlag = oData.RTVCONNECT_VENDOR;
						that.fillLabelColor(oRTVConnectFlag);

					}.bind(this),
					error: function (error) {
						sap.ui.core.BusyIndicator.hide();
					}
				});
			},
			fillLabelColor: function (oRTVConnectFlag, oWrkSheetStatus) {
				var vendorDetailTable = this.getView().byId("idVendorDetailsTable");
				var oColumn = vendorDetailTable.getColumns();
				var oColumnHeader = this.getOwnerComponent().getModel("WorkListi18n").getResourceBundle().getText("Submitted");
				var tableData = vendorDetailTable.getItems();
				var label_num;
				var oResendBtn = this.getView().byId("idResendBtn");
				if (oRTVConnectFlag === "X") {
					oResendBtn.setText(this.getOwnerComponent().getModel("WorkListi18n").getResourceBundle().getText('Email'));
					oColumn[6].getHeader().setText(oColumnHeader);
				} else {
					switch (oWrkSheetStatus) {
					case "01":
						oResendBtn.setText(this.getOwnerComponent().getModel("WorkListi18n").getResourceBundle().getText("Resend"));
						break;
					case "02":
						oResendBtn.setText(this.getOwnerComponent().getModel("WorkListi18n").getResourceBundle().getText("Resend"));
						break;
					case "03":
						oResendBtn.setText(this.getOwnerComponent().getModel("WorkListi18n").getResourceBundle().getText("Resend"));
						break;
					default:
						oResendBtn.setText(this.getOwnerComponent().getModel("WorkListi18n").getResourceBundle().getText("Send"));
					}
				}
			

				for (var i = 0; i < tableData.length; i++) {
				label_num = vendorDetailTable.getItems()[i].getCells()[4].getText();
				if (vendorDetailTable.getItems()[i] !== undefined) {
					vendorDetailTable.getItems()[i].getCells()[4].removeStyleClass("redLabelWorklist");
					vendorDetailTable.getItems()[i].getCells()[4].removeStyleClass("yellowLabelWorklist");
					vendorDetailTable.getItems()[i].getCells()[4].removeStyleClass("greenLabelWorklist");
					vendorDetailTable.getItems()[i].getCells()[4].removeStyleClass("whiteLabelWorklist");

					if (label_num.indexOf('98181') === 0) {
						vendorDetailTable.getItems()[i].getCells()[4].addStyleClass("redLabelWorklist");
					} else if (label_num.indexOf('98182') === 0) {
						vendorDetailTable.getItems()[i].getCells()[4].addStyleClass("yellowLabelWorklist");
					} else if (label_num.indexOf('98183') === 0) {
						vendorDetailTable.getItems()[i].getCells()[4].addStyleClass("greenLabelWorklist");
					} else if (label_num.indexOf('98184') === 0) {
						vendorDetailTable.getItems()[i].getCells()[4].addStyleClass("whiteLabelWorklist");
					}
				}

			}
		},

		onArticleDetail: function (oEvent) {
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				var storid = this.siteID;
				var article = oEvent.getSource().getText();

				var action = "Y_LOOKUP&/product/" + storid + "/00000000" + article + "";
				oCrossAppNavigator.toExternal({
					target: {
						semanticObject: "Article",
						action: action
					}
				});
			} else {
				//alert("App to app navigation is not supported in this mode");
			}
		},

		onRTVDetail: function (oEvent) {
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				jQuery.sap.require("jquery.sap.storage");
				var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.session);
				oStorage.put("rtvNavBack", window.location.href);
				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation"),
					oPath = this.getView().getBindingContext().getPath(),
					oSite = this.getView().getModel().getObject(oPath).Site;
				var storid = oSite;
				var RTVLabel = oEvent.getSource().getText();
				var action = "display&/object/" + storid + "/" + RTVLabel + "";
				oCrossAppNavigator.toExternal({
					target: {
						semanticObject: "YSO_VIEWRTV",
						action: action
					}
				});
			} else {
				//alert("App to app navigation is not supported in this mode");
			}
		},

		onNavBack: function () {
			this.getRouter().navTo("VendorWorklist", {}, true);
			if (this.refreshAwaiting) {
				var eventBus = sap.ui.getCore().getEventBus();
				eventBus.publish("awaiting", "refreshAwaiting", {});
				this.refreshAwaiting = false;
			}
		},

		openAttachments: function () {

		},
		_AuthorizationVerifyAccess: function () {
			var oAuthModel = this.getOwnerComponent().getModel("oAuthModel"),
				oData = oAuthModel.getData(),
				resendBtn = this.byId("idResendBtn");
			if (oData.results) {
				resendBtn.setVisible(
					oData.results.some(function (item) {
						return (item.Awaiting === "Y");
					})
				);
			} else {
				this._AuthorizationAccess();
			}

		},
		_AuthorizationAccess: function () {
			var oModel = this.getModel();
			var resendBtn = this.byId("idResendBtn");
			var oAuthModel = this.getOwnerComponent().getModel("oAuthModel");
			var that = this;
			sap.ui.core.BusyIndicator.show();
			oModel.read("/UserAuthSet", {
				success: function (oData, response) {
					oAuthModel.setData(oData);
					resendBtn.setVisible(
						oData.results.some(function (item) {
							return (item.Awaiting === "Y");
						})
					);
					sap.ui.core.BusyIndicator.hide();
				},
				error: function (oError) {
					that.createRTVBtn.setVisible(false);
					sap.ui.core.BusyIndicator.hide();
				}
			});
		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.hd.rtvworklist.view.view.VendorDetails
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.hd.rtvworklist.view.view.VendorDetails
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.hd.rtvworklist.view.view.VendorDetails
		 */
		//	onExit: function() {
		//
		//	}

	});

});