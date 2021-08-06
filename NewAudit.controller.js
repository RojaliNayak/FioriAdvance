sap.ui.define([
	"YRTV_ONE_TILE/YRTV_ONE_TILE/controller/CageAudit/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"YRTV_ONE_TILE/YRTV_ONE_TILE/model/CageAudit/formatter",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/Device",
	"sap/m/Dialog",
	"sap/m/Button"
], function (BaseController, JSONModel, History, formatter, MessageToast, MessageBox, Device, Dialog, Button) {
	"use strict";
	var __controller__;

	return BaseController.extend("YRTV_ONE_TILE.YRTV_ONE_TILE.controller.CageAudit.NewAudit", {

		formatter: formatter,

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
			__controller__ = this;
			var that = this;
			var iOriginalBusyDelay,
				oViewModel = new JSONModel({
					busy: true,
					delay: 0
				});

			this.setModel(new JSONModel({
				scanCount: 0,
				lastScanned: this.getResourceBundle().getText('NA'),
				PendingTabNew: [], //To hold all fetched labels
				ScannedList: [], //To hold all scanned valid labels
				DiscrepancyList: [] //To hold all scanned labels which are not found in PendingTabNew 
			}), "labelListModel");
			this.getModel("labelListModel").setSizeLimit(1000);
			this.getRouter().getRoute("newAudit").attachPatternMatched(this._onObjectMatched, this);

			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			oViewModel.setProperty("/busy", false);

			var searchFld = this.byId("idScanFld");
			var searchFldSizeDelegate = {
				onBeforeRendering: function () {
					if (Device.system.phone) {
						//this.setWidth("auto");
					}
					// } else {
					// 	this.setWidth("25%");
					// }
				}
			};
			searchFld.addDelegate(searchFldSizeDelegate, false, searchFld, true);

			var labelListModel = this.getModel("labelListModel").getData();

			if (!Object.getOwnPropertyDescriptor(labelListModel, "SubmitEnabled")) {
				Object.defineProperty(labelListModel, "SubmitEnabled", {
					set: function () {},
					get: function () {
						if (this.PendingTabNew && this.ScannedList) {
							return (!this.PendingTabNew.some(function (element, index, array) {
									return !element.Comments;
								}) &&
								!this.ScannedList.some(function (element, index, array) {
									return !element.Comments;
								}));
						}
						return false;
					}
				});
			}
			//Extremely important; we want to ensure user does not lose focus during input

			$.sap.focusScan = function () {
				// jQuery.sap.delayedCall(0, that, function () {
				// 	that.byId("idScanFld").focus();
				// 	that.onVKeypadHide();
				// }.bind(that));
			};
			/*
			//if(window.plugin && window.plugin.firstphone) {
			if (true){
				this.byId("idScanFld").attachBrowserEvent("focusout", $.sap.focusScan);
			}
			*/

			var pendingScanLabels = this.byId("idPendingScanLabelNew");
			var scannedLabels = this.byId("idScannedLabelNew");
			var additionalLabels = this.byId("idPendingScanLabelAdditional");
			var labelNumberDelegate = {
				onAfterRendering: function () {
					if (this.getBindingContext("CageModel")) {
						var labelNum = this.getBindingContext("CageModel").getObject().LabelNum;
					} else {
						var labelNum = this.getProperty('text');
					}
					this.removeStyleClass("redLabel");
					this.removeStyleClass("yellowLabel");
					this.removeStyleClass("greenLabel");
					this.removeStyleClass("whiteLabel");

					if (labelNum.indexOf('98181') === 0) {
						this.addStyleClass('redLabel');
					} else if (labelNum.indexOf('98182') === 0) {
						this.addStyleClass('yellowLabel');
					} else if (labelNum.indexOf('98183') === 0) {
						this.addStyleClass('greenLabel');
					}
					if (labelNum.indexOf('98184') === 0) {
						this.addStyleClass('whiteLabel');
					}
				}
			};
			pendingScanLabels.addDelegate(labelNumberDelegate, false, pendingScanLabels, true);
			scannedLabels.addDelegate(labelNumberDelegate, false, scannedLabels, true);
			additionalLabels.addDelegate(labelNumberDelegate, false, additionalLabels, true);

			this.getView().addEventDelegate({
				onAfterShow: function () {
					if (window.plugin && window.plugin.firstphone) {
						that.byId("idScanFld").attachBrowserEvent("focusout", $.sap.focusScan);
					}
					jQuery.sap.delayedCall(0, this, function () {
						// this.getView().byId("idScanFld").focus();
						// this.buildSearchPopup(true);
						// this.onVKeypadHide();
					}.bind(this));
				}.bind(this)
			});

			var navContainer = sap.ui.getCore().byId("navContainer");

			if (navContainer) {
				navContainer.attachAfterNavigate(function () {
					jQuery.sap.delayedCall(0, this, function () {
						// this.getView().byId("idScanFld").focus();
						// this.onVKeypadHide();
					}.bind(this));
				}.bind(this));
			}

		},

		onAfterRendering: function () {
			var that = this;
			document.querySelectorAll("input[id*='idScanFld']")[0].setAttribute("type", "Number");
			if (window.datawedge) {
				window.datawedge.unregisterBarcode();
				window.datawedge.registerForBarcode(function (oData) {
					that.byId("idScanFld").setValue();
					that.byId("idScanFld").setValue(oData.barcode);
					that.onSearchLabel(oData.barcode);
					that.byId("idScanFld").setValue();
				}.bind(that));
			}
		},

		onBeforeFirstShow: function (that) {

			jQuery.sap.delayedCall(0, this, function () {
				// this.getView().byId("idScanFld").focus();
				// this.onVKeypadHide();
			}.bind(this));

		},

		onTabSelect: function (oEvent) {
			this._activeTab = oEvent.getSource().getSelectedKey();

			if (this._activeTab === "pending") {
				this.getView().byId("idScanFld").focus();
				this.onVKeypadHide();
			}
		},

		setCount: function (oEvent) {

			if (oEvent.getParameter("url").indexOf("LabelDetailSet/$count") > -1) {
				if (isNaN(parseInt(oEvent.getParameter("response").responseText, 10))) {
					return;
				}
				$.sap.labelList.setProperty("/scanCount", oEvent.getParameter("response").responseText);
				$.sap.idPendingNew.setCount(oEvent.getParameter("response").responseText);
			}

		},
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler  for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the worklist route.
		 * @public
		 */

		onModelsReset: function (that) {
			if (window.plugin && window.plugin.firstphone) {
				that.byId("idScanFld").detachBrowserEvent("focusout", $.sap.focusScan);
			}
			that.getModel("labelListModel").setProperty("/scanCount", 0);
			that.getModel("labelListModel").setProperty("/lastScanned", that.getResourceBundle().getText('NA'));
			that.getModel("labelListModel").setProperty("/PendingTabNew", []);
			that.getModel("labelListModel").setProperty("/ScannedList", []);
			that.getModel("labelListModel").setProperty("/DiscrepancyList", []);
			//clear counts
			that.byId("idAdditionalNew").setCount(0);
			that.byId("idScannedNew").setCount(0);
			that.getModel("labelListModel").updateBindings();
		},

		onNavBack: function () {

			var labelListModel = this.getModel("labelListModel");
			var PendingTabNew = labelListModel.getProperty("/ScannedList");
			var discrepancyList = labelListModel.getProperty("/DiscrepancyList");
			var that = this;
			//First check if they actually scanned anything. If so, throw warning before heading back
			if (!(PendingTabNew.length === 0 && discrepancyList.length === 0)) {
				//Must remove event to focus on scan
				if (window.plugin && window.plugin.firstphone) {
					this.byId("idScanFld").detachBrowserEvent("focusout", $.sap.focusScan);
				}
				var dialog =
					new Dialog({
						title: that.getResourceBundle().getText("warning"),
						type: 'Message',
						state: 'Warning',
						content: new sap.m.Text({
							text: that.getResourceBundle().getText("WantToGoBack")
						}),
						beginButton: new Button({
							text: that.getResourceBundle().getText('yes'),
							press: function () {
								that.onModelsReset(that);
								var sPreviousHash = History.getInstance().getPreviousHash();
								if (sPreviousHash !== undefined) {
									history.go(-1);
								} else {
									that.getRouter().navTo("worklist", {}, true);
								}
								dialog.close();
							}
						}),
						endButton: new Button({
							text: that.getResourceBundle().getText("cancel"),
							press: function () {
								dialog.close();
								if (window.plugin && window.plugin.firstphone) {
									that.byId("idScanFld").attachBrowserEvent("focusout", $.sap.focusScan);
								}
								that._scanFocus();
							}
						}),
						afterClose: function () {
							dialog.destroy();
						}
					});

				dialog.open();
				return;
			}

			this.onModelsReset(this);
			var sPreviousHash = History.getInstance().getPreviousHash();
			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("worklist", {}, true);
			}

		},

		onSearchLabel: function (oEvent) {
            if (oEvent.getSource){
				var sQuery = oEvent.getSource().getValue();
			}
			else{
				var sQuery = oEvent;
			}
			// var sQuery = oEvent.getSource().getValue();

			if (oEvent.getParameter && oEvent.getParameter("query") !== undefined) {
				sQuery = (oEvent.getParameter("query")).trim();
			}

			if (!sQuery) {
				return;
			}
			var regExp = /^[0-9]{17}$/;
			// oEvent.getSource().setValue("");
			if(oEvent.getSource){
				oEvent.getSource().setValue("");
			}
			if (regExp.test(sQuery)) {
				this._checkDuplicateScan(sQuery);
			} else {
				if (!this.audioPath) {
					this.audioPath = $.sap.getModulePath("com.hd.rtvcageaudit", "/Sounds");
				}
				var audioError = new Audio(this.audioPath + '/Error.mp3');
				audioError.play();
				MessageToast.show(this.getResourceBundle().getText("validRTVMsg", sQuery), {
					duration: 6000
				});
				//this.onMessageDialog("error", this.getResourceBundle().getText("validRTVMsg"), this, false);
			}

		},

		onAuditSubmit: function () {
			var that = this;
			if (window.plugin && window.plugin.firstphone) {
				this.byId("idScanFld").detachBrowserEvent("focusout", $.sap.focusScan);
			}
			var dialog = new Dialog({
				title: this.getResourceBundle().getText('confirmation'),
				type: 'Message',
				state: 'None',
				content: new sap.m.Text({
					text: this.getResourceBundle().getText('auditSubmitMsg')
				}),
				beginButton: new Button({
					text: this.getResourceBundle().getText('ok'),
					press: function () {
						dialog.close();
						this._confirmAuditSubmit();
					}.bind(this)
				}),
				endButton: new Button({
					text: this.getResourceBundle().getText('cancel'),
					press: function () {
						dialog.close();
						if (window.plugin && window.plugin.firstphone) {
							that.byId("idScanFld").attachBrowserEvent("focusout", $.sap.focusScan);
						}
						this._scanFocus();
					}.bind(this)
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},

		_confirmAuditSubmit: function () {
			var labelListModel = this.getModel("labelListModel");
			var cageModel = this.getModel("CageModel");
			//var PendingTabNew = cageModel.getProperty("/LabelDetailSet");
			var discrepancyList = labelListModel.getProperty("/DiscrepancyList");
			var scanList = labelListModel.getProperty("/ScannedList");
			var totalCageCost = labelListModel.getProperty("/TotalCageCost");
			//var CageDiscrepancyArr = $.merge(PendingTabNew,discrepancyList);
			this.getOwnerComponent().getModel("navObjDetailsModel").setData({
				"CageStatus": "01",
				"TotalCageCost": totalCageCost
			});
			var CageDiscrepancyArr = [];
			var that = this;

			discrepancyList.forEach(function (item, i) {
				CageDiscrepancyArr.push({
					Site: item.Site,
					LabelNum: item.LabelNum,
					Status: item.Status,
					Additional: "X",
				});
			});
			scanList.forEach(function (item, i) {
				CageDiscrepancyArr.push({
					Site: item.Site,
					LabelNum: item.LabelNum,
					Status: item.Status,
					Scan: "X",
				});
			});

			var today = new Date();
			var dd = String(today.getDate()).padStart(2, '0');
			var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
			var yyyy = today.getFullYear();

			var payLoad = {
				"AuditDate": yyyy + mm + dd,
				"Site": window.siteId,
				"CageStatus": "03",
				"TotalCost": totalCageCost,
				"CageDiscrepancySet": CageDiscrepancyArr
			};
			var that = this;
			var infoMsg = [],
				errorMsg = [];
			this.getModel("objectView").setProperty("/busy", true);
			cageModel.create("/CageHistorySet", payLoad, {
				success: function (odata, response) {
					that.getModel("objectView").setProperty("/busy", false);
					if (response.headers['sap-message']) {
						var infoResponse = JSON.parse(response.headers['sap-message']);
						if (infoMsg.length === 0 && infoResponse.message !== "") {
							infoMsg.push(that.getResourceBundle().getText("infoMsgP1") + '\n');
							infoMsg.push('\n' + infoMsg.length + ". " + infoResponse.message + '\n');
							if (infoResponse.details.length > 0) {
								for (var k = 0; k < infoResponse.details.length; k++) {
									infoMsg.push(infoMsg.length + ". " + infoResponse.details[k].message + '\n');
								}
							}
						}
						infoMsg.push('\n' + that.getResourceBundle().getText("infoMsgP2"));
						that.onMessageDialog("info", (infoMsg.toString()).replace(/,/g, " "), that, true);
						infoMsg = [];
						that.onModelsReset(that);
						return;
					} else {
						// that.getRouter().navTo("discrepancyList", {
						// 									siteId: that.siteId
						// 								});
						that.onModelsReset(that);
						that.getRouter().navTo("worklist");
					}
				},
				error: function (response) {
					if (window.plugin && window.plugin.firstphone) {
						that.byId("idScanFld").attachBrowserEvent("focusout", $.sap.focusScan);
					}
					that.getModel("objectView").setProperty("/busy", false);
					if (response.responseText.indexOf('{"') !== -1) {
						var errorResponse = JSON.parse(response.responseText);
						var errorCode = JSON.parse(response.responseText).error.code; //Y_DSC_RTV/423
						var respMsg = errorResponse.error.innererror;

						for (var k = 0; k < respMsg.errordetails.length; k++) {
							if (respMsg.errordetails[k].severity === "error" && respMsg.errordetails[k].code.indexOf("IWBEP") === -1 && respMsg.errordetails[
									k].message !== "") {
								errorMsg.push(respMsg.errordetails[k].message + '\n');
							} else if (respMsg.errordetails[k].severity === "info") {
								if (infoMsg.length === 0) {
									infoMsg.push(that.getResourceBundle().getText("infoMsgP1") + '\n');
									infoMsg.push('\n' + infoMsg.length + ". " + respMsg.errordetails[k].message + '\n');
								} else {
									infoMsg.push(infoMsg.length + ". " + respMsg.errordetails[k].message + '\n');
								}
							}
						}
						if (errorMsg.length > 0) {
							var message = (errorMsg.toString()).replace(/,/g, " ");
							sap.m.MessageBox.error(
								message, {
									actions: [MessageBox.Action.OK],
									onClose: function () {
										if (errorCode = "Y_DSC_RTV/423") {
											that.getRouter().navTo("worklist");
										}
										infoMsg = [];
										errorMsg = [];
									}
								}
							);
						}
						if (infoMsg.length > 0) {
							infoMsg.push('\n' + that.getResourceBundle().getText("infoMsgP2"));
							that.onMessageDialog("info", (infoMsg.toString()).replace(/,/g, " "), that);
						}
					}
				}
			});
		},

		onMessageDialog: function (type, message, oController, navi) {
			if (window.plugin && window.plugin.firstphone) {
				this.byId("idScanFld").detachBrowserEvent("focusout", $.sap.focusScan);
			}
			var that = this;
			if (type === "info") {
				sap.m.MessageBox.information(
					message, {
						actions: [MessageBox.Action.OK],
						onClose: function (oAction) {
							if (navi) {
								// oController.getRouter().navTo("discrepancyList", {
								// 								siteId: oController.siteId
								// 							});
								oController.getRouter().navTo("worklist");
							} else {
								if (window.plugin && window.plugin.firstphone) {
									that.byId("idScanFld").attachBrowserEvent("focusout", $.sap.focusScan);
								}
								that._scanFocus();
							}
						}
					}
				);
			} else if (type === "error") {
				sap.m.MessageBox.error(
					message, {
						actions: [MessageBox.Action.OK],
						onClose: function (oAction) {
							if (navi) {
								// oController.getRouter().navTo("discrepancyList", {
								// 								siteId: oController.siteId
								// 							});
								oController.getRouter().navTo("worklist");
							} else {
								if (window.plugin && window.plugin.firstphone) {
									that.byId("idScanFld").attachBrowserEvent("focusout", $.sap.focusScan);
								}
								that._scanFocus();
							}
						}
					}
				);
			} else if (type === "warning") {
				sap.m.MessageBox.warning(
					message, {
						actions: [MessageBox.Action.OK],
						onClose: function (oAction) {
							if (window.plugin && window.plugin.firstphone) {
								that.byId("idScanFld").attachBrowserEvent("focusout", $.sap.focusScan);
							}
							that._scanFocus();
						}
					}
				);
			}
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
			this._fetchLabelList();
			this.getModel("labelListModel").updateBindings();

			var cageModel = this.getModel("CageModel");

			//window.labelListModel = this.getModel("labelListModel");
			$.sap.labelList = this.getModel("labelListModel");
			$.sap.idPendingNew = this.byId("idPendingNew");
			$.sap.that = this;
			cageModel.attachRequestCompleted(this.setCount);
			$.sap.filters = [];
			this.byId("idPendingScanTableNew").getBinding("items").filter($.sap.filters);
			//Must make call to get all labels for hashmap. 
			$.sap.labelMap = {};
			//Also define a map of all scanned labels
			$.sap.scannedMap = {};
			var that = this;
			//Must do busy indicator until it loads
			this.getModel("objectView").setProperty("/busy", true);
			cageModel.read("/LabelDetailSet", {
				success: function (oData) {
					$.grep(oData.results, function (item, i) {
						$.sap.labelMap[item.LabelNum] = item;
					});
					that.getModel("objectView").setProperty("/busy", false);
					if (!window.siteId && oData[0]) {
						window.siteId = oData[0].Site;
					}

				},
				error: function (oError) {
					that.serviceError(oError);
				}
			});

		},

		_fetchLabelList: function () {
			//var cageModel = this.getModel("CageModel");
			//var labelListModel = this.getModel("labelListModel");
			//var searchFld = this.byId("idScanFld");
			//var that = this;
			//Only get first 20 records. Must paginate
			//var gskipValue = 20;
			//var gTopValue = 20;
			//var oUrlParams = "$skip=" + gskipValue + "&$top=" + gTopValue;

			/*this.byId("idPendingScanTableNew").bindItems({
                path: "CageModel>/LabelDetailSet",
                parameters: {  expand, select, etc...  },
                filters: [new Filter("SomeProperty", FilterOperator.EQ, someControlValue)],
                template: oListItemTemplate, // your columnListItem
                templateShareable: false
	        });*/

			/*
			cageModel.read("/LabelDetailSet", {
				success: function (oData) {
					labelListModel.setProperty("/TotalCageCost", oData.results[0].TotalCageCost);
					that.siteId = oData.results[0].Site;
					that.newCount = 0;
					labelListModel.setProperty("/PendingTabNew", $.grep(oData.results, function (item, i) {
						that.newCount = that.newCount + 1;
						return item.Scan !== 'X';
					}));
					that.byId("idPendingNew").setCount(that.newCount);
					// $.map( oData.results, function( obj, i ) {
					// 	labelListModel.getProperty("/PendingTabNew").push({
					// 													"LabelNum": obj.LabelNum,
					// 													"Status":obj.Status,
					// 													"Scan":""
					// 												});
					// });
					that._scanFocus();
					that.getModel("labelListModel").updateBindings();
				},
				error: function (oError) {
					that.serviceError(oError);
				}
			});
			*/
			//Set counts for new scan
			this.byId("idAdditionalNew").setCount(0);
			//this.byId("idScannedNew").setCount(0);

			this.getOwnerComponent().googleAnalyticUpdate({
				page: "New audit",
				site: window.siteId
			}); //Google Analytics
		},

		_scanFocus: function () {
			var scanFld = this.byId("idScanFld");
			jQuery.sap.delayedCall(0, this, function () {
				// this.onVKeypadHide();
				// scanFld.focus();
			});
		},

		_checkDuplicateScan: function (sQuery) {
			var labelListModel = this.getModel("labelListModel");
			//Check map of scanned and additionals to ensure this isn't duplicate

			/*if (!(labelListModel.getProperty("/ScannedList").some(function (item, i) {
					return item.LabelNum === sQuery;
				})) &&
				!(labelListModel.getProperty("/DiscrepancyList").some(function (item, i) {
					return item.LabelNum === sQuery;
				}))
			) */

			if (!$.sap.scannedMap[sQuery]) {
				var scanResult = this._checkScan(sQuery);
				if (scanResult === false) {
					//Ok, double check if it's in additional list. If not, it's new. Otherwise still throw duplicate scan

					//Added to additionals
					//this.byId("idAdditionalNew").setCount(parseInt(this.byId("idAdditionalNew").getCount(), 10) + 1);
					//this.byId("idScannedTableAdditional").refreshItems();
				} else {
					//Must ensure label is new, and not additional
					if (this.byId("idPendingNew").getCount() > 0) {
						this.byId("idPendingNew").setCount(this.byId("idPendingNew").getCount() - 1);
						this.byId("idScannedNew").setCount(labelListModel.getProperty("/ScannedList").length);
					}
				}
			} else {
				//Warning message for already scanned labels
				MessageToast.show(this.getResourceBundle().getText("duplicateScanMsg", sQuery));
			}

			this._scanFocus();
		},

		_checkScan: function (sQuery) {
			var cageModel = this.getModel("CageModel");
			/*
			var labelListModel = this.getModel("labelListModel");
			//Must make a call to ensure this is actually a label at all.
			//Check if its a label from another site (unlikely?) or not a label at all

			// var scannedLabelTxt = this.byId("idScannedTxt");
			labelListModel.setProperty("/lastScanned", sQuery);
			// scannedLabelTxt.rerender();
			var index = cageModel.getProperty("/PendingTabNew").some(function (item, i) {
				if (item.LabelNum === sQuery) {
					var addData = labelListModel.getProperty("/PendingTabNew")[i];
					labelListModel.getProperty("/PendingTabNew").splice(i, 1);
					labelListModel.getProperty("/ScannedList").push(addData);
					labelListModel.setProperty("/scanCount", (labelListModel.getProperty("/ScannedList").length));
					return true;
				}
			});
			if (!index) {
			*/
			//Must check if it's a valid label from current site, or from another site, or not a label at all
			var that = this;
			if (!window.siteId) {
				window.siteId = '';
			}
			//CHANGE: before making a read call, check if it's in our list. If so, we know it's part of cage. If not, we should make a beep BEFORE call
			var label = $.sap.labelMap[sQuery];
			if (label) {
				$.sap.scannedMap[sQuery] = 'S';

				var oFilter1 = new sap.ui.model.Filter("LabelNum", sap.ui.model.FilterOperator.EQ, label.LabelNum);
				//Add to global list of exclusion filters
				$.sap.filters.push(oFilter1);

				that.byId("idPendingScanTableNew").getBinding("items").filter($.sap.filters);

				var newScanned = {
					"LabelNum": label.LabelNum,
					"StatusDesc": label.StatusDesc,
					"Article": label.Article,
					"Desc": label.Desc,
					"Cost": label.Cost,
					"Site": label.Site,
					"Status": label.Status,
					"Scan": "X"
				};

				that.getModel("labelListModel").getProperty("/ScannedList").push(newScanned);

				if (that.byId("idPendingNew").getCount() > 0) {
					that.byId("idScannedNew").setCount(that.getModel("labelListModel").getProperty("/ScannedList").length);
				}
				that._scanFocus();
				return;
			}
			//If here, then it wasn't part of list. Throw a beep
			//Get audio path
			if (!that.audioPath) {
				that.audioPath = $.sap.getModulePath("com.hd.rtvcageaudit", "/Sounds");
			}
			var audioError = new Audio(that.audioPath + '/Error.mp3');
			audioError.play();

			cageModel.read("/ViewLabelSet(LABEL_NUM='" + sQuery + "',WERKS='" + window.siteId + "')", {
				success: function (oData) {
					//console.log(oData);
					//Check if this label belongs in our cage
					if (!window.siteId) {
						window.siteId = oData.WERKS;
					}
					if (oData.CAGE_STATUS == 'X') {
						//This label's status is appropriate for the cage. Move it to scanned, don't play any sound
						//Instead, just FILTER it out of our scanned list table.
						//CHANGE: This is a very rare case. It means it wasn't in initital audit, BUT it's part of it now. 
						//Maybe it was a last minute addition. We should just throw a toast message to excuse our beep

						var oFilter1 = new sap.ui.model.Filter("LabelNum", sap.ui.model.FilterOperator.EQ, oData.LABEL_NUM);
						//Add to global list of exclusion filters
						$.sap.filters.push(oFilter1);

						that.byId("idPendingScanTableNew").getBinding("items").filter($.sap.filters);

						var newScanned = {
							"LabelNum": oData.LABEL_NUM,
							"StatusDesc": oData.STATUS_DESC,
							"Article": oData.MATNR,
							"Desc": oData.MAKTX,
							"Cost": oData.ITEM_COST,
							"Site": oData.WERKS,
							"Status": oData.STATUS,
							"Scan": "X"
						};

						that.getModel("labelListModel").getProperty("/ScannedList").push(newScanned);

						$.sap.scannedMap[oData.LABEL_NUM] = 'S';

						if (that.byId("idPendingNew").getCount() > 0) {
							that.byId("idScannedNew").setCount(that.getModel("labelListModel").getProperty("/ScannedList").length);
						}
						MessageToast.show(that.getResourceBundle().getText("LabelWasntInCage", sQuery), {
							duration: 6000
						});
						that._scanFocus();
						//that.getModel("labelListModel").refresh(true);
						return;
					}

					if (!oData.LABEL_NUM) {
						//Not a valid label at all
						MessageToast.show(that.getResourceBundle().getText("validRTVMsg", sQuery), {
							duration: 6000
						});
					} else {
						that.byId("idAdditionalNew").setCount(parseInt(that.byId("idAdditionalNew").getCount(), 10) + 1);
						that.getModel("labelListModel").getProperty("/DiscrepancyList").push({
							"LabelNum": oData.LABEL_NUM,
							"StatusDesc": oData.STATUS_DESC,
							"Article": oData.MATNR,
							"Desc": oData.MAKTX,
							"Cost": oData.ITEM_COST,
							"Site": oData.WERKS,
							"Status": oData.STATUS,
							"Scan": "X",
						});
						$.sap.scannedMap[oData.LABEL_NUM] = 'A';
						MessageToast.show(that.getResourceBundle().getText("LabelShouldNotBeInCage", sQuery), {
							duration: 6000
						});
						that.getModel("labelListModel").refresh(true);
						that._scanFocus();
					}
				},
				error: function (oError) {
					that.serviceError(oError);
				}
			});

			//labelListModel.getProperty("/ScannedList").push(sQuery);

			//labelListModel.setProperty("/scanCount", (labelListModel.getProperty("/ScannedList").length));
			return false;
			//}
		},

		onVKeypadHide: function () {
			// if (window.plugin && window.plugin.firstphone) {
			// 	window.plugin.firstphone.launcher.hideKeyboard();
			// 	jQuery.sap.delayedCall(0, this, function () {
			// 		window.plugin.firstphone.launcher.hideKeyboard();
			// 	});
			// }
		},

		onRTVDetail: function (oEvent) {
			var that = this;
			if (window.plugin && window.plugin.firstphone) {
				this.byId("idScanFld").detachBrowserEvent("focusout", $.sap.focusScan);
			}
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				__controller__.RTVLabel = oEvent.getSource().getText();

				var dialog = new Dialog({
					title: __controller__.getResourceBundle().getText('warning'),
					type: 'Message',
					state: 'Warning',
					content: new sap.m.Text({
						text: __controller__.getResourceBundle().getText('toViewRTV')
					}),
					beginButton: new Button({
						text: __controller__.getResourceBundle().getText('yes'),
						press: function () {
							dialog.close();
							var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
							var action = "display&/object/" + window.siteId + "/" + __controller__.RTVLabel + "";
							oCrossAppNavigator.toExternal({
								target: {
									semanticObject: "YSO_VIEWRTV",
									action: action
								}
							});
						}.bind(this)
					}),
					endButton: new Button({
						text: __controller__.getResourceBundle().getText('cancel'),
						press: function () {
							if (window.plugin && window.plugin.firstphone) {
								that.byId("idScanFld").attachBrowserEvent("focusout", $.sap.focusScan);
							}
							that._scanFocus();
							dialog.close();
						}
					}),
					afterClose: function () {
						if (window.plugin && window.plugin.firstphone) {
							that.byId("idScanFld").attachBrowserEvent("focusout", $.sap.focusScan);
						}
						that._scanFocus();
						dialog.destroy();
					}
				});
				dialog.open();
			}
		},
	});
});