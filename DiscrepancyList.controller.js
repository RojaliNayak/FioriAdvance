/*global location*/
sap.ui.define([
	"YRTV_ONE_TILE/YRTV_ONE_TILE/controller/CageAudit/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"YRTV_ONE_TILE/YRTV_ONE_TILE/model/CageAudit/formatter",
	"sap/m/MessageBox",
	"sap/m/Dialog",
	"sap/m/Button"
], function (BaseController, JSONModel, History, formatter, MessageBox, Dialog, Button) {
	"use strict";

	var __controller__;

	return BaseController.extend("YRTV_ONE_TILE.YRTV_ONE_TILE.controller.CageAudit.DiscrepancyList", {

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

			var iOriginalBusyDelay,
				oViewModel = new JSONModel({
					busy: true,
					delay: 0
				});

			this.setModel(new JSONModel({
				PendingScanList: [], //To hold pending scan labels
				ScannedList: [], //To hold all scanned labels
				AdditionalList: [], //To hold all Additional labels
				PendingCount: '',
				ScannedCount: '',
				AdditionalCount: ''
			}), "DiscrepancyListModel");
			this.getModel("DiscrepancyListModel").setSizeLimit(1000);
			this.getRouter().getRoute("discrepancyList").attachPatternMatched(this._onObjectMatched, this);

			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			this.setModel(this.getOwnerComponent().getModel("navObjDetailsModel"), "navObjDetails");
			var discrepancyListModelData = this.getModel("DiscrepancyListModel").getData();

			// if (!Object.getOwnPropertyDescriptor(discrepancyListModelData, "SubmitEnabled")) {
			// 	Object.defineProperty(discrepancyListModelData, "SubmitEnabled", {
			// 		set: function () {},
			// 		get: function () {
			// 			if (this.PendingScanList && this.ScannedList) {
			// 				return (!this.PendingScanList.some(function (element, index, array) {
			// 						return !element.Comments;
			// 					}) &&
			// 					!this.ScannedList.some(function (element, index, array) {
			// 						return !element.Comments;
			// 					}));
			// 			}
			// 			return false;
			// 		}
			// 	});
			// }

			// var scanTable = this.byId('idScannedTable');
			// var unscanTable = this.byId('idPendingScanTable');
			// var additionalTable = this.byId('idAdditionalScanTable');

			// var scanCountDelegate = {
			// 	onAfterRendering: function (oEvent) {
			// 		var scanTableTitle = __controller__.getResourceBundle().getText("scannedLabels", [this.getBinding("items").getLength()]);
			// 		__controller__.getModel("DiscrepancyListModel").setProperty("/scanTableTitle", scanTableTitle);
			// 	}
			// };

			// var unscanCountDelegate = {
			// 	onAfterRendering: function (oEvent) {
			// 			var unscanTableTitle = __controller__.getResourceBundle().getText("pendingScanLabels", [this.getBinding("items").getLength()]);
			// 			__controller__.getModel("DiscrepancyListModel").setProperty("/unscanTableTitle", unscanTableTitle);
			// 		}
			// 		/*,
			// 							onBeforeRendering: function() {
			// 								this.attachUpdateStarted(function() {
			// 							console.log("start");
			// 								this.setBusy(true);
			// 								this.setBusyIndicatorDelay(0);
			// 							});
			// 							this.attachUpdateFinished(function() {
			// 							console.log("finish");
			// 								this.setBusy(false);
			// 							});
			// 							}*/
			// };
			// scanTable.addDelegate(scanCountDelegate, false, scanTable, true);
			// unscanTable.addDelegate(unscanCountDelegate, false, unscanTable, true);
			/*unscanTable.attachUpdateStarted(function() {
				console.log("start");
					this.setBusy(true);
					this.setBusyIndicatorDelay(0);
				});
			unscanTable.attachUpdateFinished(function() {
				console.log("finish");
					this.setBusy(false);
				});*/

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
		onNavBack: function () {
			// var discrepancyListModel = this.getModel("DiscrepancyListModel");
			// discrepancyListModel.setProperty("/PendingScanList", []);
			// discrepancyListModel.setProperty("/ScannedList", []);
			// this.getRouter().navTo("returnToWorklist");
			this.byId("idPendingScanTable").unbindItems(true);
			this.byId("idAdditionalScanTable").unbindItems(true);
			this.byId("idScannedTable").unbindItems(true);
			window.history.go(-1);
		},

		onCommentsSubmit: function () {
			var discrepancyList = this.getModel("DiscrepancyListModel");
			var commentLabelList = $.merge(discrepancyList.getProperty("/PendingScanList"), discrepancyList.getProperty("/ScannedList"));
			//var cageCost = this.getModel("navObjDetails").getData().CageCost;
			var auditDate = this.getModel("navObjDetails").getData().AuditDate;
			var cageModel = this.getModel("CageModel");
			var site = this.siteId;
			var that = this;
			var payLoad = {
				"Site": site,
				"CageStatus": "02",
				"AuditDate": auditDate,
				"CageDiscrepancySet": commentLabelList
			};
			this.getModel("objectView").setProperty("/busy", true);
			cageModel.create("/CageHistorySet", payLoad, {
				success: function (odata, response) {
					that.getModel("objectView").setProperty("/busy", false);
					that.getRouter().navTo("worklist");
				},
				error: function (oError) {
					that.serviceError(oError);
				}
			});
		},

		onRTVDetail: function (oEvent) {
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				__controller__.RTVLabel = oEvent.getSource().getText();

				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				var action = "display&/object/" + __controller__.siteId + "/" + __controller__.RTVLabel + "";
				oCrossAppNavigator.toExternal({
					target: {
						semanticObject: "YSO_VIEWRTV",
						action: action
					}
				});
				// var dialog = new Dialog({
				// 	title: __controller__.getResourceBundle().getText('warning'),
				// 	type: 'Message',
				// 	state: 'Warning',
				// 	content: new sap.m.Text({
				// 		text: __controller__.getResourceBundle().getText('toViewRTV')
				// 	}),
				// 	beginButton: new Button({
				// 		text: __controller__.getResourceBundle().getText('yes'),
				// 		press: function () {
				// 			dialog.close();

				// 		}.bind(this)
				// 	}),
				// 	endButton: new Button({
				// 		text: __controller__.getResourceBundle().getText('cancel'),
				// 		press: function () {
				// 			dialog.close();
				// 		}
				// 	}),
				// 	afterClose: function () {
				// 		dialog.destroy();
				// 	}
				// });
				// dialog.open();
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
			this.siteId = oEvent.getParameter("arguments").siteId;
			var auditDate = oEvent.getParameter("arguments").auditDate;
			var discrepancyListModel = this.getModel("DiscrepancyListModel");
			var cageModel = this.getModel("CageModel");
			var message = this.getResourceBundle().getText("noDiscrepancy");
			var activeTab = jQuery.sap.storage(jQuery.sap.storage.Type.session).get("selectedTab");
			if(activeTab === "additional"){
				this.getView().byId("idCageDiscrepancyTab").setSelectedKey("additional");
			}else {
				if(activeTab === "scanned"){
					this.getView().byId("idCageDiscrepancyTab").setSelectedKey("scanned");
				}
			}
			var oMissedFilters = [
				new sap.ui.model.Filter("Site", "EQ", this.siteId)
			];
			var oAddFilters = [
				new sap.ui.model.Filter("Site", "EQ", this.siteId)
			];
			var oScannedFilters = [
				new sap.ui.model.Filter("Site", "EQ", this.siteId)
			];
			
			this.byId("discPage").setTitle(this.getResourceBundle().getText("discrepancyListTitle") + " - " + formatter.formatDate(auditDate));
			
			oMissedFilters.push(new sap.ui.model.Filter("Additional", "EQ", ""));
			oMissedFilters.push(new sap.ui.model.Filter("Scan", "EQ", ""));
			oAddFilters.push(new sap.ui.model.Filter("Additional", "EQ", "X"));
			oScannedFilters.push(new sap.ui.model.Filter("Scan", "EQ", "X"));
			
			if (auditDate) {
				oMissedFilters.push(new sap.ui.model.Filter("AuditDate", "EQ", auditDate));
				oAddFilters.push(new sap.ui.model.Filter("AuditDate", "EQ", auditDate));
				oScannedFilters.push(new sap.ui.model.Filter("AuditDate", "EQ", auditDate));
			}
			var that = this;
			var oAuthModel = this.getOwnerComponent().getModel("oAuthModel"),
				sData = oAuthModel.getData();
			var submitBtn = this.byId("idSubmitBtn");

			if (!sData.results) {
				var oModel = this.getOwnerComponent().getModel("CageModel");
				sap.ui.core.BusyIndicator.show();
				oModel.read("/UserAuthSet", {
					success: function (oData, response) {
						oAuthModel.setData(oData);
						sap.ui.core.BusyIndicator.hide();
						sData = oAuthModel.getData();
					},
					error: function (oError) {
						sap.ui.core.BusyIndicator.hide();
					}
				});
			} else {
				// submitBtn.setVisible(
				// 	sData.results.some(function (item) {
				// 		return (item.Cage_audit === "Y");
				// 	})
				// );
			}
			//Must bind 3 times. Once with scanned = 'X', once with additional = 'X', and once with neither
			//This is less efficient for backend, but more for frontend.
			//Ensure we only create delegate once
			$.sap.init = "X";
			var labelNumberDelegate = {
				onAfterRendering: function () {
					
					var labelNum = this.getBindingContext("CageModel").getObject().LabelNum;
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
			
			//var pendingScanLabelNumber = this.byId("idPendingScanLabelNumber");
			//var scannedLabelNumber = this.byId("idScannedLabelNumber");
			//var additionalLabels = this.byId("idAdditionalLabelNumber");

			
			//pendingScanLabelNumber.addDelegate(labelNumberDelegate, false, pendingScanLabelNumber, true);
			//scannedLabelNumber.addDelegate(labelNumberDelegate, false, scannedLabelNumber, true);
			//additionalLabels.addDelegate(labelNumberDelegate, false, additionalLabels, true);
			
			var pendLink = new sap.m.Link({
			            id: "idPendingScanLabelNumber", 
			            text: "{CageModel>LabelNum}", 
			            press: this.onRTVDetail
			        });
			
			var oPendTemplate = new sap.m.ColumnListItem({
			    cells : [
			        pendLink.addDelegate(labelNumberDelegate, false, pendLink, true).addStyleClass("labelLinkBox"),
			        new sap.m.Text({
			            text : "{CageModel>StatusDesc}"
			        }),
			        new sap.m.Text({
			            text : "{CageModel>Article}"
			        }), 
			        new sap.m.Text({
			            text : "{CageModel>Desc}",
			            tooltip: "{DiscrepancyListModel>Desc}",
			            class: "OverflowTruncate"
			        }),
			        new sap.m.Text().bindText({ 
				    	path: "CageModel>Cost", 
				    	formatter: this.formatter.formatCost
					})
			    ]
			});
			
			var addLink = new sap.m.Link({
			            id: "idAdditionalLabelNumber", 
			            text: "{CageModel>LabelNum}", 
			            press: this.onRTVDetail
			        });
			
			var oAddTemplate = new sap.m.ColumnListItem({
			    cells : [
			        addLink.addDelegate(labelNumberDelegate, false, addLink, true).addStyleClass("labelLinkBox"),
			        new sap.m.Text({
			            text : "{CageModel>StatusDesc}"
			        }),
			        new sap.m.Text({
			            text : "{CageModel>Article}"
			        }), 
			        new sap.m.Text({
			            text : "{CageModel>Desc}",
			            tooltip: "{DiscrepancyListModel>Desc}",
			            class: "OverflowTruncate"
			        }),
			        new sap.m.Text().bindText({ 
				    	path: "CageModel>Cost", 
				    	formatter: this.formatter.formatCost
					})
			    ]
			});
			
			var scanLink = new sap.m.Link({
			            id: "idScannedLabelNumber", 
			            text: "{CageModel>LabelNum}", 
			            press: this.onRTVDetail
			        });
			
			var oScannedTemplate = new sap.m.ColumnListItem({
			    cells : [
			        scanLink.addDelegate(labelNumberDelegate, false, scanLink, true).addStyleClass("labelLinkBox"),
			        new sap.m.Text({
			            text : "{CageModel>StatusDesc}"
			        }),
			        new sap.m.Text({
			            text : "{CageModel>Article}"
			        }), 
			        new sap.m.Text({
			            text : "{CageModel>Desc}",
			            tooltip: "{DiscrepancyListModel>Desc}",
			            class: "OverflowTruncate"
			        }),
			        new sap.m.Text().bindText({ 
				    	path: "CageModel>Cost", 
				    	formatter: this.formatter.formatCost
					})
			    ]
			});
		
			this.byId("idPendingScanTable").bindItems({
	        path: "CageModel>/CageDiscrepancySet",
	        filters:oMissedFilters,
	        templateShareable: false,
	        template: oPendTemplate,
			events: {
					dataReceived: function(oData) {
						//Set count for all 3
						if (oData.getParameter("data").results[0]){
							discrepancyListModel.setProperty("/ScannedCount", oData.getParameter("data").results[0].ScannedCount);
							discrepancyListModel.setProperty("/PendingCount", oData.getParameter("data").results[0].PendingCount);
							discrepancyListModel.setProperty("/AdditionalCount", oData.getParameter("data").results[0].AdditionalCount);
							
							that.byId("idPending").setCount(oData.getParameter("data").results[0].PendingCount);
							that.byId("idAdditional").setCount(oData.getParameter("data").results[0].AdditionalCount);
							that.byId("idScanned").setCount(oData.getParameter("data").results[0].ScannedCount);
							
						}
						//oViewModel.setProperty("/busy", false);
					}
				}
			}
			);
			
			this.byId("idAdditionalScanTable").bindItems({
		        path: "CageModel>/CageDiscrepancySet",
		        filters:oAddFilters,
		        templateShareable: false,
		        template: oAddTemplate
		    	}
			);
			
			
			this.byId("idScannedTable").bindItems({
		        path: "CageModel>/CageDiscrepancySet",
		        filters:oScannedFilters,
		        templateShareable: false,
		        template: oScannedTemplate
		    	}
			);	
		
		

			
			this.getModel("objectView").setProperty("/busy", false);
			
			/*
			cageModel.read("/CageDiscrepancySet", {
				filters: oFilters,
				success: function (oData) {
					that.getModel("objectView").setProperty("/busy", false);
					if (oData.results.length > 0) {
						//that.getOwnerComponent().getModel("navObjDetailsModel").setProperty("/CageCost", oData.results[0].TotalCost);
						that.getOwnerComponent().getModel("navObjDetailsModel").setProperty("/AuditDate", oData.results[0].AuditDate);

						// Set the counts
						discrepancyListModel.setProperty("/ScannedCount", oData.results[0].ScannedCount);
						discrepancyListModel.setProperty("/PendingCount", oData.results[0].PendingCount);
						discrepancyListModel.setProperty("/AdditionalCount", oData.results[0].AdditionalCount);

						discrepancyListModel.setProperty("/ScannedList", $.grep(oData.results, function (item, i) {
							return item.Scan === 'X';
						}));
						discrepancyListModel.setProperty("/PendingScanList", $.grep(oData.results, function (item, i) {
							return (item.Scan !== 'X');
						}));
						discrepancyListModel.setProperty("/AdditionalList", $.grep(oData.results, function (item, i) {
							return (item.Additional === 'X');
						}));
					} else {
						MessageBox.information(
							message, {
								actions: [MessageBox.Action.OK],
								onClose: function (oAction) {
									that.getRouter().navTo("worklist");
								}
							}
						);
					}
				},
				error: function (oError) {
					that.serviceError(oError);
				}
			});
			*/
			this.getOwnerComponent().googleAnalyticUpdate({
				page: "Discrepancy list",
				site: this.siteId
			}); //Google Analytics
		},
		
		onTabSelect: function(oEvent){
			this._activeTab = oEvent.getSource().getSelectedKey();
			jQuery.sap.require("jquery.sap.storage");
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.session);
			oStorage.put("rtvNavBack", window.location.href);
			oStorage.put("selectedTab", this._activeTab );
		}
	});
});