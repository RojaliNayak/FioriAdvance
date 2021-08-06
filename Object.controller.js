/*global location*/
sap.ui.define([
	"YRTV_ONE_TILE/YRTV_ONE_TILE/controller/METWorklist/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"YRTV_ONE_TILE/YRTV_ONE_TILE/model/METWorklist/formatter",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Text",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/format/DateFormat"
], function (BaseController,
	JSONModel,
	History,
	formatter,
	Dialog, Button, Text, MessageToast, MessageBox,
	Filter, FilterOperator, DateFormat) {
	"use strict";

	return BaseController.extend("YRTV_ONE_TILE.YRTV_ONE_TILE.controller.METWorklist.Object", {

		formatter: formatter,

		DateFormat: DateFormat.getDateInstance({
			pattern: "MM/dd/yyyy"
		}),

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var iOriginalBusyDelay,
				oViewModel = new JSONModel({
					busy: true,
					delay: 0
				});

			this.getRouter().getRoute("METobject").attachPatternMatched(this._onObjectMatched, this);

			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			this.getOwnerComponent().getModel().metadataLoaded().then(function () {
				// Restore original busy indicator delay for the object view
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});

		},
		/**
		 * Event handler  for navigating back.
		 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the worklist route.
		 * @public
		 */
		onNavBack: function () {
			this.getView().getAggregation('content')[0].setEnableScrolling(false);
			var that = this;
			if (this.edit === true) {
				var dialog = new Dialog({
					title: that.getResourceBundle().getText('Warning'),
					type: 'Message',
					state: 'Warning',
					content: new Text({
						text: this.getResourceBundle().getText("backWarning")
					}),
					beginButton: new Button({
						text: 'OK',
						press: function () {
							dialog.close();
							this.getRouter().navTo("worklist", {}, true);
						}.bind(this)
					}),
					endButton: new Button({
						text: that.getResourceBundle().getText('CANCEL'),
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
				this.getRouter().navTo("worklist", {}, true);
			}

			//var sPreviousHash = History.getInstance().getPreviousHash(),
			// 	oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			// if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
			//	history.go(-1);
			// } else {
			// 	this.getRouter().navTo("worklist", {}, true);
			// }
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function (oEvent) {
			this.getView().getAggregation('content')[0].setEnableScrolling(true);
			this.edit = false;
			var sObjectId = oEvent.getParameter("arguments").objectId;
			var sSite = oEvent.getParameter("arguments").site;
			var region = oEvent.getParameter("arguments").region;
			var oModel = this.getModel();
			var oViewModel = this.getModel("objectView");
			var oAuthModel = this.getOwnerComponent().getModel("oAuthModel"),
				oData = oAuthModel.getData();
			if (oData.results) {
				var __enabled__ = oData.results.some(function (item) {
					return (item.Met === "Y");
				});

				this.byId("idRejectBtn").setVisible(__enabled__);
				this.byId("idApproveBtn").setVisible(__enabled__);
				this.byId("idExtendBtn").setVisible(__enabled__);

				thd.walkThroughUI(this.getView(), thd.includeByClass(sap.m.Input, thd.setProperty("enabled", __enabled__)));
				thd.walkThroughUI(this.getView(), thd.includeByClass(sap.m.Select, thd.setProperty("enabled", __enabled__)));
				thd.walkThroughUI(this.getView(), thd.includeByClass(sap.m.TextArea, thd.setProperty("enabled", __enabled__)));
			} else {
				this._AuthorizationAccess();
			}
			this.getOwnerComponent().metSetSite(sSite);

			oViewModel.setProperty("/busy", true);

			var aFilters = [
				new Filter("LABEL_NUM", "EQ", sObjectId),
				new Filter("WERKS", "EQ", sSite)
			];
			sap.ui.core.BusyIndicator.show();
			var sRead = "/MetLabelDetailSet";
			oModel.read(sRead, {
				filters: aFilters,
				urlParameters: {
					"$expand": "Carriers,Payments,Rev_Disps"
				},
				success: function (oData) {

					this.getModel("Detail").setProperty("/Label", oData.results[0]);
					this.getModel("Detail").setProperty("/Label/RGA_COPY", oData.results[0].RGA);
					this.getModel("Detail").setProperty("/Dispositions", oData.results[0].Rev_Disps.results);
					this.getModel("Detail").setProperty("/Carriers", oData.results[0].Carriers.results);
					this.getModel("Detail").setProperty("/Carriers_all", oData.results[0].Carriers.results);
					this.getModel("Detail").setProperty("/Payments", oData.results[0].Payments.results);

					var labelNumber = this.getView().byId("LabelNumber");
					var labelNum = this.getModel("Detail").getProperty("/Label/LABEL_NUM");
					//var labelNum = labelNumber.getBindingContext().getObject().LABEL_NUM;
					labelNumber.removeStyleClass("redLabelWorklist");
					labelNumber.removeStyleClass("yellowLabelWorklist");
					labelNumber.removeStyleClass("greenLabelWorklist");
					labelNumber.removeStyleClass("whiteLabelWorklist");
					if (labelNum.indexOf('98181') === 0) {
						labelNumber.addStyleClass('redLabelWorklist');
					} else if (labelNum.indexOf('98182') === 0) {
						labelNumber.addStyleClass('yellowLabelWorklist');
					} else if (labelNum.indexOf('98183') === 0) {
						labelNumber.addStyleClass('greenLabelWorklist');
					} else if (labelNum.indexOf('98184') === 0) {
						labelNumber.addStyleClass('whiteLabelWorklist');
					}

					var oVendNameLbl = this.byId("vend_name_Label"),
						oVendNameIP = this.byId("vend_name_IP"),
						oApproveBtn = this.byId("idApproveBtn"),
						oCarrierSelect = this.byId("carrier"),
						oCarrierAccount = this.byId("vend_act");

					oCarrierAccount.setValue("");
					if (oCarrierSelect.getSelectedKey() === "OT") {
						oVendNameLbl.setVisible(true);
						oVendNameIP.setVisible(true);
						oApproveBtn.setEnabled(false);
					} else {
						oVendNameIP.setValue("");
						oVendNameLbl.setVisible(false);
						oVendNameIP.setVisible(false);
					}

					sap.ui.core.BusyIndicator.hide();

				}.bind(this),
				error: function () {}
			});

			sRead = "/MetWorksheetSet(LABEL_NUM='" + sObjectId + "',WERKS='" + sSite + "')";
			oModel.read(sRead, {
				success: function (oData) {

					oData.ORIGINAL_FREIGHT_TERM_CODE = oData.FREIGHT_TERM_CODE;
					this.getModel("Detail").setProperty("/Worksheet", oData);
					var key = oData.FREIGHT_TERM_CODE;
					var all = this.getModel("Detail").getProperty("/Carriers_all");
					var carr = [];

					for (var i = all.length - 1; i >= 0; i--) {
						if (all[i].FRGHT_TERM_COD === key) {
							carr.push(all[i]);

							if (all[i].PCT_FLG) {
								this.getModel("Detail").setProperty("/Worksheet/CARRIER", all[i].CARRIER);
							}
						}
					}

					this.getModel("Detail").setProperty("/Carriers", carr);

					var list = this.byId("addr_region");
					var b = list.getBindingInfo("items");
					if (oData.COUNTRY === "US") {
						b.path = "/US_REGIONS";
					} else {
						b.path = "/CA_REGIONS";
					}
					list.bindItems(b);

					this.getModel("Detail").checkUpdate(true);
				}.bind(this),
				error: function () {}
			});

			this._us_regions = this.getModel("Detail").getProperty("/US_REGIONS");
			this._ca_regions = this.getModel("Detail").getProperty("/CA_REGIONS");

			if (!this._us_regions || !this._ca_regions) {
				var aFilters = [
					new Filter("LAND1", "EQ", "US")
				];
				var sRead = "/MetRegionSet";
				oModel.read(sRead, {
					filters: aFilters,
					success: function (oData) {
						this.getModel("Detail").setProperty("/US_REGIONS", oData.results);
						// var list = this.byId("addr_region");
						// var b = list.getBindingInfo("items");
						// list.bindItems(b);
					}.bind(this),
					error: function () {}
				});

				aFilters = [
					new Filter("LAND1", "EQ", "CA")
				];
				oModel.read(sRead, {
					filters: aFilters,
					success: function (oData) {
						this.getModel("Detail").setProperty("/CA_REGIONS", oData.results);
						// var list = this.byId("addr_region");
						// var b = list.getBindingInfo("items");
						// list.bindItems(b);
					}.bind(this),
					error: function () {}
				});
			}
			this.getOwnerComponent().googleAnalyticUpdate({
				page: "/MET Label Detail",
				site: sSite
			}); //Google Analytics
			oViewModel.setProperty("/busy", false);

		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView: function (sObjectPath) {
			var oViewModel = this.getModel("objectView"),
				oDataModel = this.getModel();

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oDataModel.metadataLoaded().then(function () {
							// Busy indicator on view should only be set if metadata is loaded,
							// otherwise there may be two busy indications next to each other on the
							// screen. This happens because route matched handler already calls '_bindView'
							// while metadata is loaded.
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function () {
			var oView = this.getView(),
				oViewModel = this.getModel("objectView"),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}

			var oResourceBundle = this.getResourceBundle(),
				oObject = oView.getBindingContext().getObject(),
				sObjectId = oObject.LABEL_NUM,
				sObjectName = oObject.LIFNR_NAME,
				sWorksheet = oObject.WORKSHEET;
			//sLifnr = oObject.LIFNR;

			var oModel = this.getModel();

			var sRead = "/LabelDetailSet(LABEL_NUM='" + sObjectId + "',WERKS='" + this.getOwnerComponent().metGetSite() + "')";
			oModel.read(sRead, {
				success: function (oData) {
					this.getModel("Detail").setProperty("/Label", oData);
				}.bind(this),
				error: function () {}
			});

			sRead = "/WorksheetSet(LABEL_NUM='" + sObjectId + "',WERKS='" + this.getOwnerComponent().metGetSite() + "')";
			oModel.read(sRead, {
				success: function (oData) {
					oData.ORIGINAL_FREIGHT_TERM_CODE = oData.FREIGHT_TERM_CODE;

					this.getModel("Detail").setProperty("/Worksheet", oData);
					this.getModel("Detail").setProperty("/Worksheet/WORKSHEET", sWorksheet);
					var key = oData.FREIGHT_TERM_CODE;
					var all = this.getModel("Detail").getProperty("/Carriers_all");
					var carr = [];

					for (var i = all.length - 1; i >= 0; i--) {
						if (all[i].FRGHT_TERM_COD === key) {
							carr.push(all[i]);

							if (all[i].PCT_FLG) {
								this.getModel("Detail").setProperty("/Worksheet/CARRIER", all[i].CARRIER);
							}
						}
					}

					this.getModel("Detail").setProperty("/Carriers", carr);

					this.getModel("Detail").checkUpdate(true);
				}.bind(this),
				error: function () {}
			});

			// Everything went fine.
			oViewModel.setProperty("/busy", false);
			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("saveAsTileTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		onEdit: function (oEvent) {
			this.edit = true;
			var oVendNameLbl = this.byId("vend_name_Label"),
				oVendNameIP = this.byId("vend_name_IP");
			if (this.getView().byId("carrier").getSelectedKey() === "OT") {
				oVendNameLbl.setVisible(true);
				oVendNameIP.setVisible(true);
			} else {
				oVendNameIP.setValue("");
				oVendNameLbl.setVisible(false);
				oVendNameIP.setVisible(false);
			}
		},

		onSendPress: function () {
			var that = this;
			if (!this._emailPopUp) {
				this._emailPopUp = sap.ui.xmlfragment("carton", "YRTV_ONE_TILE.YRTV_ONE_TILE.view.METWorklist.SendEmail", this);
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
			jQuery.sap.delayedCall(10, that, function () {
				that._emailPopUp.setBusy(true);
			});
		},
		onEmailToChange: function (oEvent) {
			var emailToFld = oEvent.getSource();
			var enteredEmailTo = emailToFld.getValue();
			var emailRegex = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/,
				oDetailModel = this.getView().getModel("Detail"),
				oData = oDetailModel.getData();
			if (enteredEmailTo.length !== 0) {
				if (emailRegex.test(enteredEmailTo)) {
					emailToFld.setValueState("None");
					oData.emailContent.SendEnabled = true;
				} else {
					emailToFld.setValueState("Error");
					oData.emailContent.SendEnabled = false;
				}
			} else {
				emailToFld.setValueState("Error");
				oData.emailContent.SendEnabled = false;
			}
		},

		onEmailCopyChange: function (oEvent) {
			var emailCopyFld = oEvent.getSource(),
				// emailToFld = sap.ui.getCore().byId("carton--EmailTo"),
				enteredEmailCopy = emailCopyFld.getValue(),
				emailRegex = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/,
				emailArray = enteredEmailCopy.split(";"),
				oDetailModel = this.getView().getModel("Detail"),
				oData = oDetailModel.getData();

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
			oData.emailContent.SendEnabled = validState;
		},
		_getEmailContent: function () {
			var that = this;
			this._emailPopUp.setBusy(true);
			var oDetailModel = this.getView().getModel("Detail");
			var oMessage = this.getResourceBundle().getText("EMAIL_ERROR");
			var oUrlParameters = {
				"WERKS": "'" + this.getModel("Detail").getProperty('/Worksheet/WERKS') + "'",
				"FUNCTION": "'01'",
				"LABELNUMBER": "'" + this.getModel("Detail").getProperty('/Label/LABEL_NUM') + "'",
				"EMAILTO": "' '",
				"EMAILCC": "' '",
				"EMAILTEXT": "' '"
			};
			var sPath = "/MET_EMAIL";
			this.getModel().read(sPath, {
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
					oDetailModel.setProperty("/emailContent", oData);
					that._emailPopUp.setBusy(false);
				},
				error: function (oError) {
					that._emailPopUp.setBusy(false);
					sap.m.MessageBox.show(
						oMessage, {
							icon: sap.m.MessageBox.Icon.ERROR,
							title: that.getResourceBundle().getText("ERROR"),
							actions: [sap.m.MessageBox.Action.OK],
							onClose: function (oAction) {
								that._emailPopUp.close();
							}
						}
					);
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
		onEmailSendPress: function () {

			var that = this;

			jQuery.sap.delayedCall(10, that, function () {
				that._emailPopUp.setBusy(true);
			});
			var sPath = "/MET_EMAIL";
			var oUrlParameters = {
				"WERKS": "'" + this.getModel("Detail").getProperty('/Worksheet/WERKS') + "'",
				"FUNCTION": "'02'",
				"LABELNUMBER": "'" + this.getModel("Detail").getProperty('/Label/LABEL_NUM') + "'",
				"EMAILTO": "'" + this.getModel("Detail").getProperty('/emailContent/EmailTo') + "'",
				"EMAILCC": "'" + this.getModel("Detail").getProperty('/emailContent/EmailCc') + "'",
				"EMAILTEXT": "'" + this.getModel("Detail").getProperty('/emailContent/EmailText').replace(/(?:\r\n|\r|\n)/g, '<br>') + "'"
			};

			this.getModel().read(sPath, {
				urlParameters: oUrlParameters,
				success: function (oData) {
					that._emailPopUp.close();
					that._emailPopUp.setBusy(false);
					// that.refreshAwaiting = true;
					sap.m.MessageToast.show(that.getResourceBundle().getText("EMAIL_SUCCESS"));
				},
				error: function (oError) {
					that._emailPopUp.setBusy(false);
					// that.refreshAwaiting = false;
					sap.m.MessageBox.show(
						JSON.parse(oError.responseText).error.message.value, {
							icon: sap.m.MessageBox.Icon.ERROR,
							title: that.getResourceBundle().getText("ERROR"),
							actions: [sap.m.MessageBox.Action.OK],
							onClose: function (oAction) {}
						});
				}
			});
		},

		onExtendDeadline: function (oEvent) {

			var value = this.getModel("Detail").getProperty("/Label/DUE_DATE");
			var message = this.getResourceBundle().getText("extendMessage") + " " + this.getModel("Detail").getProperty("/Label/EXTEND_DAYS") +
				" " + this.getResourceBundle().getText("extendMessage1");

			var dialog = new Dialog({
				title: this.getResourceBundle().getText('Warning'),
				type: 'Message',
				state: 'Warning',
				content: new Text({
					text: message
				}),
				beginButton: new Button({
					text: 'OK',
					press: function () {
						dialog.close();
						this._extend();
					}.bind(this)
				}),
				endButton: new Button({
					text: this.getResourceBundle().getText('CANCEL'),
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},

		_extend: function () {
			var oDataModel = this.getModel();
			var that = this,
				LABEL_NUM = this.getView().byId("LabelNumber").getText();

			oDataModel.callFunction("/EXTEND_DUE_DATE", // function import name
				// "POST", // http method
				{
					urlParameters: {
						"LABEL_NUM": LABEL_NUM,
						"WERKS": this.getOwnerComponent().metGetSite()
					}, // function import parameters
					success: function (oData, response) {
						this.getModel("Detail").setProperty("/Label/EXTENDED_DATE", "X");
						var sValue = oData.EXTEND_DUE_DATE.DUE_DATE;
						var dueDate = sValue.toString().substring(4, 6) + "/" + sValue.toString().substring(6, 8) + "/" + sValue.toString().substring(
							0, 4);
						var message = this.getResourceBundle().getText("dueDateMessage", [dueDate]);
						sap.m.MessageToast.show(message);
						oDataModel.updateBindings();
						oDataModel.refresh();
					}.bind(this), // callback function for success
					error: function (oError) {}
				}); // callback function for error
		},

		onCompletePress1: function (oEvent) {
			var ADDR_LINE1_TXT = this.getView().byId("addr_line_1").getValue().replace(/\s/g, "");
			var CITY1 = this.getView().byId("addr_city").getValue().replace(/\s/g, "");
			var COUNTRY = this.getView().byId("addr_country").getSelectedKey().replace(/\s/g, "");
			var POST_CODE_1 = this.getView().byId("addr_post").getValue().replace(/\s/g, "");
			var REGION = this.getView().byId("addr_region").getSelectedKey().replace(/\s/g, "");
			var PAYMENT_TERM = this.getView().byId("ship_term").getSelectedKey().replace(/\s/g, "");
			var CARRIER = this.getView().byId("carrier").getSelectedKey().replace(/\s/g, "");
			var REV_DISP = this.getView().byId("idDisposion").getSelectedKey().replace(/\s/g, "");
			var oVendAcc = this.getView().byId("vend_act").getValue();
			var oVendName = this.getView().byId("vend_name_IP").getValue();
			var oCarrier = this.getView().byId("carrier").getSelectedKey();

			var oResourceBundle = this.getResourceBundle();

			var comment = this.byId("idComment").getProperty("value").replace(/\s/g, "");
			var rga = this.byId("idRGA").getProperty("value").replace(/\s/g, "");
			var message = null;

			var approve = '01';

			if (oEvent.getSource().getId().indexOf("idRejectBtn") !== -1) {
				approve = '02';
			}

			if (!ADDR_LINE1_TXT) {
				message = oResourceBundle.getText("EnterReturnAddress");
			} else if (!CITY1) {
				message = oResourceBundle.getText("enterCity");
			} else if (!REGION) {
				message = oResourceBundle.getText("enterProvince");
			} else if (!COUNTRY) {
				message = oResourceBundle.getText("enterCountry");
			} else if (!POST_CODE_1) {
				message = oResourceBundle.getText("enterPostalCode");
			} else if (!PAYMENT_TERM && approve === "01") {
				message = oResourceBundle.getText("selectShippingTerm");
			} else if (!rga && approve === "01") {
				message = oResourceBundle.getText("enterRGA");
			} else if ((!comment) && approve === "02") {
				message = oResourceBundle.getText("enterVendorComments");
			} else if ((PAYMENT_TERM === 'C') && (oVendAcc === "") && (approve === "01") && (REV_DISP === "01")) {
				message = oResourceBundle.getText("No_Vend_Acc");
			} else if ((PAYMENT_TERM === 'C') && (oCarrier === "OT") && (oVendName === "") && (approve === "01")) {
				message = oResourceBundle.getText("No_Carr_Acc");
			} else if ((PAYMENT_TERM === 'C') && (oCarrier === "") && (approve === "01")) {
				message = oResourceBundle.getText("No_Carr");
			}

			if (message) {
				var dialog = new Dialog({
					title: oResourceBundle.getText('Error'),
					type: sap.m.DialogType.Message,
					state: 'Error',
					content: new Text({
						text: message
					}),
					endButton: new Button({
						text: 'OK',
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
				this._complete(approve);
			}

		},

		_complete: function (VEND_APPROVAL) {
			var oDataModel = this.getModel();
			var that = this,
				oLabel = this.getView().byId("LabelNumber").getText(),
				LABEL_NUM = oLabel.substring(0, 17),
				ADDR_LINE1_TXT = this.getView().byId("addr_line_1").getValue(),
				ADDR_LINE2_TXT = this.getView().byId("addr_line_2").getValue(),
				CARRIER = this.getView().byId("carrier").getSelectedKey(),
				CITY1 = this.getView().byId("addr_city").getValue(),
				COUNTRY = this.getView().byId("addr_country").getSelectedKey(),
				ORI_SEC_DISP_CODE = this.getView().byId("idDisposion").getSelectedKey(),
				PAYMENT_TERM = this.getView().byId("ship_term").getSelectedKey(),
				POST_CODE_1 = this.getView().byId("addr_post").getValue(),
				REGION = this.getView().byId("addr_region").getSelectedKey(),
				RGA = this.getView().byId("idRGA").getValue(),
				//VEND_APPROVAL =  this.getView().byId("idApprove").getSelectedKey(),
				VEND_COMMENT = this.getView().byId("idComment").getValue(),
				VEND_ACC = this.getView().byId("vend_act").getValue(),
				CARR_ACC = this.getView().byId("vend_name_IP").getValue();

			window._metSearch = LABEL_NUM;
			window.VEND_APPROVAL = VEND_APPROVAL;
			if (VEND_APPROVAL === "02") {
				ORI_SEC_DISP_CODE = "";
				RGA = this.getModel("Detail").getProperty("/Label/RGA");
			}

			oDataModel.callFunction("/COMPLETE_LABEL", // function import name
				// "POST", // http method
				{
					urlParameters: {
						"LABEL_NUM": LABEL_NUM,
						"WERKS": this.getOwnerComponent().metGetSite(),
						"ADDR_LINE1_TXT": ADDR_LINE1_TXT,
						"ADDR_LINE2_TXT": ADDR_LINE2_TXT,
						"CARRIER": CARRIER,
						"CITY1": CITY1,
						"COUNTRY": COUNTRY,
						"ORI_SEC_DISP_CODE": ORI_SEC_DISP_CODE,
						"PAYMENT_TERM": PAYMENT_TERM,
						"POST_CODE_1": POST_CODE_1,
						"REGION": REGION,
						"RGA": RGA,
						"VEND_APPROVAL": VEND_APPROVAL,
						"VEND_COMMENT": VEND_COMMENT,
						"CARRIER_ACCOUNT": VEND_ACC,
						"CARRIER_OTHERS": CARR_ACC
					}, // function import parameters
					success: function (oData, response) {
						// navigate back to list
						// add refreshing previous serach result
						var oMessage;
						if (window.VEND_APPROVAL === "01") {
							oMessage = that.getResourceBundle().getText("LBL_APPR");

						} else {
							oMessage = that.getResourceBundle().getText("LBL_REJC");

						}
						MessageToast.show((oMessage), {
							duration: 10000
						});
						that.getOwnerComponent()._backAfterLabeComplete = true;
						that.getRouter().navTo("worklist", {}, true);
					}, // callback function for success
					error: function (oError) {}
				}); // callback function for error
		},

		onPayChange: function (oEvent) {
			this.onEdit();
			var key = oEvent.getSource().getProperty("selectedKey");
			var all = this.getModel("Detail").getProperty("/Carriers_all");
			var carr = [];

			var oVendAccLabl = this.getView().byId("vend_act_Label");
			var oVendAccTxt = this.getView().byId("vend_act");

			if (key === "C") {
				oVendAccLabl.setVisible(true);
				oVendAccTxt.setVisible(true);
			} else {
				oVendAccLabl.setVisible(false);
				oVendAccTxt.setVisible(false);
			}

			for (var i = all.length - 1; i >= 0; i--) {
				if (all[i].FRGHT_TERM_COD === key) {
					carr.push(all[i]);
				}
			}
			this.getModel("Detail").setProperty("/Worksheet/CARRIER", "");
			this.getModel("Detail").setProperty("/Carriers", carr);

		},

		onRTVDetail: function (oEvent) {
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				jQuery.sap.require("jquery.sap.storage");
				var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.session);
				oStorage.put("rtvNavBack", window.location.href);
				this.RTVLabel = oEvent.getSource().getText();
				if (this.edit === true) {

					var dialog = new Dialog({
						title: this.getResourceBundle().getText('Warning'),
						type: 'Message',
						state: 'Warning',
						content: new Text({
							text: this.getResourceBundle().getText("toViewRTV")
						}),
						beginButton: new Button({
							text: 'OK',
							press: function () {
								dialog.close();
								var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
								var action = "display&/object/" + this.getOwnerComponent().metGetSite() + "/" + this.RTVLabel + "";
								window._metNavBack = 'X';
								oCrossAppNavigator.toExternal({
									target: {
										semanticObject: "YSO_VIEWRTV",
										//semanticObject: "YViewRTVSem",
										action: action
									}
								});
							}.bind(this)
						}),
						endButton: new Button({
							text: this.getResourceBundle().getText('CANCEL'),
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
					var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
					var action = "display&/object/" + this.getOwnerComponent().metGetSite() + "/" + this.RTVLabel + "";
					window._metNavBack = 'X';
					oCrossAppNavigator.toExternal({
						target: {
							semanticObject: "YSO_VIEWRTV",
							action: action
						}
					});
				}
			} else {
				//alert("App to app navigation is not supported in this mode");
			}
		},

		onArticleDetail: function (oEvent) {
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				this.article = oEvent.getSource().getText();
				if (this.edit === true) {
					var dialog = new Dialog({
						title: this.getResourceBundle().getText('Warning'),
						type: 'Message',
						state: 'Warning',
						content: new Text({
							text: this.getResourceBundle().getText("toALU")
						}),
						beginButton: new Button({
							text: 'OK',
							press: function () {
								dialog.close();
								var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
								var action = "Y_LOOKUP&/product/" + this.getOwnerComponent().metGetSite() + "/00000000" + this.article + "";
								window._metNavBack = 'X';
								oCrossAppNavigator.toExternal({
									target: {
										semanticObject: "Article",
										action: action
									}
								});
							}.bind(this)
						}),
						endButton: new Button({
							text: this.getResourceBundle().getText('CANCEL'),
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
					window._metNavBack = 'X';
					var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
					var action = "Y_LOOKUP&/product/" + this.getOwnerComponent().metGetSite() + "/00000000" + this.article + "";
					oCrossAppNavigator.toExternal({
						target: {
							semanticObject: "Article",
							action: action
						}
					});
				}
			} else {
				//alert("App to app navigation is not supported in this mode");
			}
		},
		_AuthorizationAccess: function () {
			var oModel = this.getOwnerComponent().getModel();
			var oAuthModel = this.getOwnerComponent().getModel("oAuthModel"),
				that = this;

			sap.ui.core.BusyIndicator.show();
			oModel.read("/UserAuthSet", {
				success: function (oData, response) {
					oAuthModel.setData(oData);
					var appModel = that.getModel("APP");

					var isMET = oData.results.some(function (item) {
						return (item.Met === "Y");
					});
					
					var __enabled__ = isMET;

					that.byId("idRejectBtn").setVisible(__enabled__);
					that.byId("idApproveBtn").setVisible(__enabled__);
					that.byId("idExtendBtn").setVisible(__enabled__);

					// thd.walkThroughUI(that.getView(), thd.includeByClass(sap.m.Input, thd.setProperty("enabled", __enabled__)));
					// thd.walkThroughUI(that.getView(), thd.includeByClass(sap.m.Select, thd.setProperty("enabled", __enabled__)));
					// thd.walkThroughUI(that.getView(), thd.includeByClass(sap.m.TextArea, thd.setProperty("enabled", __enabled__)));

					appModel.setProperty("/met", isMET);
					appModel.setProperty("/isMET", isMET);
					appModel.setProperty("/isITSupport", isMET);
					appModel.setProperty("/is3rdParty", isMET);

					sap.ui.core.BusyIndicator.hide();
				},
				error: function (oError) {

					sap.ui.core.BusyIndicator.hide();
				}
			});
		},

		onCountryChange: function (oEvent) {
			this.onEdit();
			var COUNTRY = oEvent.getSource().getProperty("selectedKey");
			var list = this.byId("addr_region");
			var b = list.getBindingInfo("items");
			if (COUNTRY === "US") {
				b.path = "/US_REGIONS";
			} else {
				b.path = "/CA_REGIONS";
			}
			list.bindItems(b);
		}
	});

});