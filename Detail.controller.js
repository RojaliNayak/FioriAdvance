/*global location */
sap.ui.define([
	"com/hd/rtvview/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"com/hd/rtvview/model/formatter",
	"sap/ui/ux3/OverlayContainer",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, formatter, OverlayContainer, MessageToast, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("com.hd.rtvview.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});

			this.setModel(oViewModel, "detailView");

			this.getView().addEventDelegate({
				onBeforeFirstShow: function () {
					var oModel = this.getModel();
					var hash = window.location.hash.split("/");
					if (hash[1] === "object" && hash[3] !== undefined) {
						var sQuery = hash[3];
						var sSite = hash[2];
						this.getOwnerComponent().site = sSite;
						this._label = sQuery;
						var filters = [];
						filters.push(new Filter("LABEL_NUM", FilterOperator.EQ, sQuery));
						filters.push(new Filter("WERKS", FilterOperator.EQ, sSite));
						var that = this;

						this.getModel("screen").setProperty("/detailPath", {
							WERKS: sSite,
							LABEL_NUM: sQuery
						});

						oModel.read("/LabelSet", {
							filters: filters,
							success: function (oData, reponse) {
								var sObjectPath = that.getModel().createKey("LabelSet", {
									WERKS: oData.results[0].WERKS,
									LABEL_NUM: oData.results[0].LABEL_NUM
								});
								if((oData.results[0].STATUS == '410' || oData.results[0].STATUS == '910')
									&& oData.results[0].SHIP_ID !== ''){
									that.getView().byId("idPrintBOLBtn").setVisible(true);
								} else{
									that.getView().byId("idPrintBOLBtn").setVisible(false);
								}
								that._AuthorizationAccess(sObjectPath, oData.results[0].LABEL_NUM, oData.results[0].WERKS);
								// that._bindView("/" + sObjectPath);
								// that.getRouter().getRoute("object").attachPatternMatched(that._onObjectMatched, that);

								// that.populateComments(oData.results[0].LABEL_NUM, oData.results[0].WERKS);
							}
						});
					} else {
						this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
					}
				}.bind(this)
			});
		},
		onPrintBOL: function () {
			var bindObj = this.getView().getBindingContext().getObject();
			var shipId = bindObj.SHIP_ID;
			var siteId = bindObj.WERKS;
			this._openPDF(shipId, siteId, this);
		},
		_openPDF: function (shipId, siteId, that) {
			var oModel = this.getOwnerComponent().getModel();
			var serviceUrl = oModel.sServiceUrl;
			serviceUrl = serviceUrl.replace('YDRTV_RTV_VIEW3_SRV','YDRTV_RTV_CREATE_SRV');
			var sPath = serviceUrl + "/WLBOL_PDFSet(SHIP_ID='" + shipId + "',WERKS='" + siteId + "')/$value";
			var oUrl;
			if (sap.ui.Device.system.phone) {
				oUrl = "/sap/bc/ui5_ui5/sap/yrtv_pdfjs/js/web/viewer.html?file=" + encodeURIComponent(sPath);
			} else {
				oUrl = sPath;
			}
			sap.m.URLHelper.redirect(oUrl, true);
		},

		populateComments: function (LABEL_NUM, WERKS) {
			var commentModel = this.getModel("CommentsModel");
			var filters = [];
			filters.push(new Filter("LABEL_NUM", FilterOperator.EQ, LABEL_NUM));
			filters.push(new Filter("WERKS", FilterOperator.EQ, WERKS));
			this.getModel().read("/CommentSet", {
				filters: filters,
				success: function (oData) {
					commentModel.setProperty("/Comments", oData.results);
					commentModel.setProperty("/Count", oData.results.length);
					commentModel.updateBindings();
					sap.ui.core.BusyIndicator.hide();

					//commentModel.refresh();

				},
				error: function () {
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function () {
			var oViewModel = this.getModel("detailView");

			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function () {
			var oViewModel = this.getModel("detailView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});

			oShareDialog.open();
		},

		/**
		 * Event handler  for navigating back.
		 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the master route.
		 * @public
		 */
		onNavBack: function () {
			// only for a phone
			//if (sap.ui.Device.system.phone){
				//this.getOwnerComponent().list.setSelectedItem(this.getOwnerComponent().list.getSelectedItem(), false);
				//this.getRouter().getTargets().display("master");
				//this.getOwnerComponent().listBack = "X";
			//}
			
			// this.getView().getAggregation('content')[0].setEnableScrolling(false);
			var hash = window.location.hash.split("/");
			if (hash[1] === "object" && hash[3] !== undefined) {
				history.go(-1);
			}else{
			this.getRouter().navTo("master", {}, true, true);
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function (oEvent) {
			// var oAuthModel = this.getOwnerComponent().getModel("oAuthModel"),
			// 	oData = oAuthModel.getData();
			// if (oData.results) {
			// 	var delBtn = this.getView().byId("idDeleteBtn");
			// 	delBtn.setVisible(
			// 		oData.results.some(function (item) {
			// 			return (item.Tag_delete === "Y");
			// 		})
			// 	);
			// }
			var sWERKS = oEvent.getParameter("arguments").WERKS;
			var sLABEL_NUM = oEvent.getParameter("arguments").LABEL_NUM;
			this._label = sLABEL_NUM;
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("LabelSet", {
					WERKS: sWERKS,
					LABEL_NUM: sLABEL_NUM
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
			// Start Set This Title only PSC USers
			var oAuthModel = this.getOwnerComponent().getModel("oAuthModel"),
				oAuthData = oAuthModel.getData(),
				oText = this.getResourceBundle().getText("detailTitle"),
				oTitle,
				oDetailPage = this.getView().byId("page");
			
			if (oAuthData.results[0].PSC_User == 'Y') {
				oTitle = oText + '-' + sWERKS;
				oDetailPage.setTitle(oTitle);
			}
			// End Set This Title only PSC USers

			this.populateComments(sLABEL_NUM, sWERKS);
			this.getOwnerComponent().googleAnalyticUpdate({
				page: "View RTV",
				site: sWERKS
			}); //Google Analytics

		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function (sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function () {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailNoObjectsAvailable");
				return;
			}
			
			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.MATNR,
				sObjectName = oObject.Maktx,
				oViewModel = this.getModel("detailView");
			
			// Start Set This Title only PSC USers
			var oAuthModel = this.getOwnerComponent().getModel("oAuthModel"),
				oAuthData = oAuthModel.getData(),
				oText = this.getResourceBundle().getText("detailTitle"),
				oTitle,
				oDetailPage = this.getView().byId("page");
			
			if (oAuthData.results[0].PSC_User == 'Y') {
				oTitle = oText + '-' + oObject.WERKS;
				oDetailPage.setTitle(oTitle);
			}
			// End Set This Title only PSC USers

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));

		},

		_openLabelDetails1: function (oItem) {
			var bReplace = "false";
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				return;
			}

			var sPath = oElementBinding.getPath(),
				oObject = oView.getModel().getObject(sPath),
				sWERKS = oObject.WERKS,
				sLABEL_NUM = oObject.LABEL_NUM;

			this.getRouter().navTo("objectlabel", {
					WERKS: sWERKS,
					LABEL_NUM: sLABEL_NUM
				},
				bReplace);
		},

		_openVendorDetails: function (oItem) {
			var bReplace = "false";
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				return;
			}

			var sPath = oElementBinding.getPath(),
				oObject = oView.getModel().getObject(sPath),
				sWERKS = oObject.WERKS,
				sLABEL_NUM = oObject.LABEL_NUM;

			this.getRouter().navTo("objectvendor1", {
					WERKS: sWERKS,
					LABEL_NUM: sLABEL_NUM
				},
				bReplace);
		},

		_openComments: function (oItem) {
			var bReplace = "false";
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				return;
			}

			var sPath = oElementBinding.getPath(),
				oObject = oView.getModel().getObject(sPath),
				sWERKS = oObject.WERKS,
				sLABEL_NUM = oObject.LABEL_NUM;

			this.getRouter().navTo("comments1", {
					WERKS: sWERKS,
					LABEL_NUM: sLABEL_NUM
				},
				bReplace);
		},

		_openHistory: function (oItem) {
			var bReplace = "false";
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				return;
			}

			var sPath = oElementBinding.getPath(),
				oObject = oView.getModel().getObject(sPath),
				sWERKS = oObject.WERKS,
				sLABEL_NUM = oObject.LABEL_NUM;

			this.getRouter().navTo("history1", {
					WERKS: sWERKS,
					LABEL_NUM: sLABEL_NUM
				},
				bReplace);
		},

		_openWorksheetHistory: function (oItem) {
			var bReplace = "false";
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				return;
			}

			var sPath = oElementBinding.getPath(),
				oObject = oView.getModel().getObject(sPath),
				sWERKS = oObject.WERKS,
				sLABEL_NUM = oObject.LABEL_NUM;

			this.getRouter().navTo("worksheetHistory1", {
					WERKS: sWERKS,
					LABEL_NUM: sLABEL_NUM
				},
				bReplace);
		},

		_openAttachments: function (oItem) {
			var bReplace = "false";
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				return;
			}

			var sPath = oElementBinding.getPath(),
				oObject = oView.getModel().getObject(sPath),
				sWERKS = oObject.WERKS,
				sLABEL_NUM = oObject.LABEL_NUM;

			this.getRouter().navTo("attachments1", {
					WERKS: sWERKS,
					LABEL_NUM: sLABEL_NUM
				},
				bReplace);
		},

		handler: function (oEvent) {},

		onArticleNumPress: function (oEvent) {

			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				jQuery.sap.require("sap.m.MessageBox");
				var article = oEvent.getSource().getIntro();

				window.rtv_back_navigation = "X";
				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				var storid = this.getOwnerComponent().site;
				var action = "Y_LOOKUP&/product/" + storid + "/00000000" + article + "";
				oCrossAppNavigator.toExternal({
					target: {
						semanticObject: "Article",
						action: action
					}
				});
			} else {
				MessageToast.show(this.getResourceBundle().getText("AppToAppNavNotPossible"));
			}

		},

		onDeletePress: function () {
			// create dialog lazily
			if (!this._oDialog) {
				// create dialog via fragment factory
				this._oDialog = sap.ui.xmlfragment("com.hd.rtvview.view.DeleteDialog", this);
				// connect dialog to view (models, lifecycle)
				this.getView().addDependent(this._oDialog);
			}
			sap.ui.getCore().byId("idDelComment").setProperty("value", "");
			sap.ui.getCore().byId("idDeleteReason1").setProperty("selectedKey", "01");
			sap.ui.getCore().byId("delDlgButton").setProperty("enabled", false);
			this._oDialog.open();
			this.onDelReasonChange();
		},

		onDelCommentChange: function (arg1) {
			var comment = arg1.getParameter("value");
			if (!comment.replace(/\s/g, "")) {
				sap.ui.getCore().byId("delDlgButton").setProperty("enabled", false);
			} else {
				sap.ui.getCore().byId("delDlgButton").setProperty("enabled", true);
			}
		},

		onDelReasonChange: function () {
			var delReas = sap.ui.getCore().byId("idDeleteReason1").getProperty("selectedKey");
			var commentModel = this.getModel("CommentsModel");
			var setOriginal = commentModel.getData().SecondDispositionSetOriginal;
			var newSet = [];
			if (setOriginal) {
				for (var i = 0; i < setOriginal.length; i++) {
					if (delReas === "01" && setOriginal[i].Code === "01") {
						continue;
					} // when Delete Reason is Lost, then "Return to Sales Floor" in Sec. Disposition is omitted
					if (delReas === "03" && setOriginal[i].Code === "02") {
						continue;
					} // when Delete Reason is "Receiving Error", then "Scrap" in Sec. Disposition is omitted
					newSet.push(setOriginal[i]);
				}
			}
			commentModel.setProperty("/SecondDispositionSet", newSet);
			commentModel.updateBindings();
			commentModel.refresh();
		},

		onDialogDelPress: function () {
			var comment = sap.ui.getCore().byId("idDelComment").getValue();
			if ((comment.trim()).length < 5) {
				MessageToast.show(this.getResourceBundle().getText("EnterComment"));
				return;
			}

			var delReas = sap.ui.getCore().byId("idDeleteReason1").getProperty("selectedKey");
			var oDataModel = this.getModel();

			var sPath = this.getView().getElementBinding().getPath(),
				oObject = this.getModel().getObject(sPath),
				sTime = oObject.TIMESTAMP;

			var that = this;
			sap.ui.core.BusyIndicator.show();
			oDataModel.callFunction("/DELETE_LABEL", // function import name
				// "POST", // http method
				{
					urlParameters: {
						"LABEL_NUM": this._label,
						"DEL_RSN_COD": delReas,
						"COMMENTS": comment,
						"WERKS": this.getOwnerComponent().site,
						"TIMESTAMP": sTime
					}, // function import parameters
					success: function (oData, response) {
						MessageToast.show(that.getResourceBundle().getText("DeleteSuccess"));
						that.populateComments(that._label, that.getOwnerComponent().site);
					}, // callback function for success
					error: function (oError) {
						//if ( JSON.parse(oError.responseText).error.code === "Y_DSC_RTV/357" )
						// if(true) {
						sap.ui.core.BusyIndicator.hide();
						sap.m.MessageBox.show(
							JSON.parse(oError.responseText).error.message.value, {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: that.getResourceBundle().getText("Error"),
								styleClass: that.getOwnerComponent().getContentDensityClass(),
								actions: [sap.m.MessageBox.Action.OK],
								onClose: function (oAction) {
									var filters = [];
									filters.push(new Filter("LABEL_NUM", FilterOperator.EQ, that._label));
									filters.push(new Filter("WERKS", FilterOperator.EQ, that.getOwnerComponent().site));
									var that_ = that;
									var oDataModel_ = oDataModel;
									oDataModel.read("/LabelSet", {
										filters: filters,
										success: function (oData, response) {
											that_.populateComments(that_._label, that_.getOwnerComponent().site);
										}
									});
								}
							});
						// }
					}
				}); // callback function for error
			this._oDialog.close();
		},

		_AuthorizationAccess: function (sObjectPath, oLabel, oWerks) {
			var oModel = this.getOwnerComponent().getModel();
			var oAuthModel = this.getOwnerComponent().getModel("oAuthModel");
			var delBtn = this.getView().byId("idDeleteBtn");
			sap.ui.core.BusyIndicator.show();
			var that = this;
			oModel.read("/UserAuthSet", {
				success: function (oData, response) {
					oAuthModel.setData(oData);
					sap.ui.core.BusyIndicator.hide();
					if (oData.results) {
						delBtn.setVisible(
							oData.results.some(function (item) {
								return (item.Tag_delete === "Y" || item.PSC_User === "Y");
							})
						);
					}
					that._bindView("/" + sObjectPath);
					that.getRouter().getRoute("object").attachPatternMatched(that._onObjectMatched, that);
					that.populateComments(oLabel, oWerks);
				},
				error: function (oError) {
					sap.ui.core.BusyIndicator.hide();
				}
			});

		},

		onDialogCancelDelPress: function () {
			this._oDialog.close();
		}
	});

});