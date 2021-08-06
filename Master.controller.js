/*global history */
sap.ui.define([
	"com/hd/rtvview/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/GroupHeaderListItem",
	"sap/ui/Device",
	"com/hd/rtvview/model/formatter",
	"com/hd/rtvview/model/grouper",
	"com/hd/rtvview/model/GroupSortState",
	"sap/m/MessageToast",
	"sap/ui/core/ValueState",
	"sap/m/Token",
	"sap/ui/Device"
], function (BaseController, JSONModel, Filter, FilterOperator, GroupHeaderListItem, Device, formatter, grouper, GroupSortState,
	MessageToast, ValueState, Token) {
	"use strict";

	return BaseController.extend("com.hd.rtvview.controller.Master", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		test1: function () {},
		/**
		 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
		 * @public
		 */

		onInit: function () {
			// Control state model
			var oList = this.byId("list"),
				oViewModel = this._createViewModel();
			this._oList = oList;
			this.getOwnerComponent().list = oList;
			this._iDialogClosing = false;
			// keeps the filter and search state
			this._oListFilterState = {
				aFilter: [],
				aSearch: []
			};

			this.setModel(oViewModel, "masterView");

			this.getView().addEventDelegate({
				afterNavigate: function () {
					var oModel = this.getModel();
				}.bind(this)
			});

			this.getView().addEventDelegate({
				onAfterNavigate: function () {
					var oModel = this.getModel();
				}.bind(this)
			});

			this._firstShow = "X";
			this.getView().addEventDelegate({
				onBeforeFirstShow: this.onBeforeFirstShow(this)
			});

			oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataFoundText"));
			this.getRouter().attachBypassed(this.onBypassed, this);

			// moving master list down to give space for "Advaned Search" button in the master view 
			if (Device.system.phone) {
				$("head").append('<style type="text/css"></style>');
				this.newStyleElement = $("head").children(':last');
				this.newStyleElement.html(".sapUiSizeCompact .sapMPageWithHeader.sapMPageWithSubHeader>section{top:9rem;} ");

				$("head").append('<style type="text/css"></style>');
				this.newStyleElement1 = $("head").children(':last');
				this.newStyleElement1.html(".sapMPage>.sapMPageHeader + .sapMPageSubHeader + section{top:9rem;} ");
			} else {
				$("head").append('<style type="text/css"></style>');
				this.newStyleElement = $("head").children(':last');
				this.newStyleElement.html(".sapUiSizeCompact .sapMPageWithHeader.sapMPageWithSubHeader>section{top:6.5rem;} ");

				$("head").append('<style type="text/css"></style>');
				this.newStyleElement1 = $("head").children(':last');
				this.newStyleElement1.html(".sapMPage>.sapMPageHeader + .sapMPageSubHeader + section{top:6.5rem;} ");
			}

			this.getView().addEventDelegate({
				onAfterShow: function () {
					jQuery.sap.delayedCall(500, this, function () {
						this.getView().byId("searchField").focus();
						// this.buildSearchPopup(true);
						this.onVKeypadHide();
					}.bind(this));
				}.bind(this)
			});

			var navContainer = sap.ui.getCore().byId("navContainer");

			if (navContainer) {
				navContainer.attachAfterNavigate(function () {
					jQuery.sap.delayedCall(500, this, function () {
						this.getView().byId("searchField").focus();
						this.onVKeypadHide();
					}.bind(this));
				}.bind(this));
			}
			// this._AuthorizationAccess();

			this._AuthorizationAccess();

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * After list data is available, this handler method updates the
		 * master list counter and hides the pull to refresh control, if
		 * necessary.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function (oEvent) {
			this.onBeforeFirstShow();
			if (this._iDialogClosing) {
				this._iDialogClosing = false;
			} else {
				this.getView().setBusy(false);
				window.scrol_actual = oEvent.getParameter("actual");
				if (this.getModel().getDefaultCountMode() === sap.ui.model.odata.CountMode.InlineRepeat) {
					var count = this.getView().byId("list").getGrowingInfo().total;
					if (this.getView().byId("list").getGrowingInfo().total !== oEvent.getParameter("actual")) {
						count = this.getView().byId("list").getGrowingInfo().total - oEvent.getParameter("actual");
					}
					this._updateListItemCount(count);
					this.getModel().setDefaultCountMode(sap.ui.model.odata.CountMode.None);
					if (this.getView().byId("list").getGrowingInfo().total > 998) {
						MessageToast.show(this.getResourceBundle().getText("ListCount999"));
					}
				}

				// hide pull to refresh if necessary
				this.byId("pullToRefresh").hide();
				jQuery.sap.delayedCall(500, this, function () {
					this.getView().byId("searchField").focus();
					this.onVKeypadHide();
				});
				if (this.selected_item) {
					var sPath = this.selected_item.getBindingContextPath();
					var arrayItems = this.getView().byId("list").getItems();
					for (var i = 0; i < arrayItems.length; i++) {
						if (arrayItems[i].getBindingContextPath() === sPath) {
							this.getView().byId("list").setSelectedItem(arrayItems[i], true);
							this.getView().byId("list").getSelectedItem().focus();
							break;
						}
					}
					this.selected_item = null;
				} else if (this.getView().byId("list").getItems().length === 1) {
					var firstItem = this.getView().byId("list").getItems()[0];
					this.getView().byId("list").setSelectedItem(firstItem, true);
					this._updateListItemCount(1);
					this._AuthorizationAccess(firstItem);
					// this._showDetail(firstItem);
				} else {
					if (!this.skipDetailsCleaning && oEvent.getParameter("reason") !== "Growing") {
						this.getRouter().navTo("master", {}, true);
						if (Device.system.phone) {
							this.getRouter().getTargets().display("master");
						} else {
							this.getRouter().getTargets().display("notFound");
						}
					}
				}
			}

			if (this.getView().byId("list").getItems().length === 0) {
				this._updateListItemCount(0);
				var oFilterLabel = this.getView().byId("filterBar");
				if (oFilterLabel.getVisible()) {
					var oMessage = this.getResourceBundle().getText("NoLabelsFound");
					MessageToast.show(oMessage);
				}
				if (Device.system.phone) {
					this.getRouter().getTargets().display("master");
				}
			}

			if (this.getOwnerComponent().site === "" && this.getView().byId("list").getItems().length > 0) {
				var werks = this.getModel().getProperty(this.getView().byId("list").getItems()[0].getBindingContextPath()).WERKS;
				this.getOwnerComponent().site = werks;
				var oCount = this.getView().byId("list").getItems().length;
				this._updateListItemCount(oCount);
				// this.onRefresh();
			} else {
				var oCount = this.getView().byId("list").getItems().length;
				this._updateListItemCount(oCount);
				// this.onRefresh();
			}

			this.getOwnerComponent().oAppControl.showMaster();
			this.getOwnerComponent().googleAnalyticUpdate({
				page: "View RTV",
				site: this.getOwnerComponent().site
			}); //Google Analytics
		},

		/**
		 * Event handler for the master search field. Applies current
		 * filter value and triggers a new search. If the search field's
		 * 'refresh' button has been pressed, no new search is triggered
		 * and the list binding is refresh instead.
		 * @param {sap.ui.base.Event} oEvent the search event
		 * @public
		 */
		onSearch: function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
				return;
			}

			var sQuery = oEvent.getParameter("query").trim();
			var that = this;

			oEvent.getSource().setValue(""); //for consistent behavior of scanner

			if (sQuery) {
				var filters = [];
				filters.push(new Filter("LABEL_NUM", FilterOperator.EQ, sQuery));
				filters.push(new Filter("WERKS", FilterOperator.EQ, this.getOwnerComponent().site));
				var list = that.byId("list");
				var b = list.getBindingInfo("items");
				b.filters = filters;
				b.path = "/LabelSet";
				this._oList.removeSelections();
				var oModel = this.getModel();
				oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.InlineRepeat);
				list.bindItems(b);
			} else {
				MessageToast.show(this.getResourceBundle().getText("EnterSearchCriterias"));
			}
		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function () {
			this._oList.getBinding("items").refresh();
			this._oList.removeSelections();
			var oModel = this.getModel();
			oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.InlineRepeat);
		},

		/**
		 * Event handler for the list selection event
		 * @param {sap.ui.base.Event} oEvent the list selectionChange event
		 * @public
		 */
		onSelectionChange1: function (oEvent) {
			var oItem = (oEvent.getParameter("listItem") || oEvent.getSource());
			this._AuthorizationAccess(oItem);
			// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
			// this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
		},

		/**
		 * Event handler for the bypassed event, which is fired when no routing pattern matched.
		 * If there was an object selected in the master list, that selection is removed.
		 * @public
		 */
		onBypassed: function () {

			this._oList.removeSelections(true);

		},

		/**
		 * Event handler for navigating back.
		 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
		 * If not, it will navigate to the shell home
		 * @public
		 */
		onNavBack: function () {
			jQuery.sap.require("jquery.sap.storage");
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.session);
			var url = oStorage.get("rtvNavBack");
			if (url) {
				location.assign(url);
				oStorage.put("rtvNavBack", null);
				return;
			}
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				oCrossAppNavigator.toExternal({
					target: {
						semanticObject: "#"
					}
				});
				// }
			} else {
				history.go(-1);
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		_createViewModel: function () {
			return new JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "",
				delay: 0,
				title: this.getResourceBundle().getText("masterTitleCount", [0]),
				noDataText: this.getResourceBundle().getText("masterListNoDataText"),
				sortBy: "Maktx",
				groupBy: "None"
			});
		},

		/**
		 * If the master route was hit (empty hash) we have to set
		 * the hash to to the first item in the list as soon as the
		 * listLoading is done and the first item in the list is known
		 * @private
		 */
		//		_onMasterMatched: function() {
		//
		//		},

		/**
		 * Shows the selected item on the detail page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showDetail: function (oItem) {

			if (this.getOwnerComponent().listBack === "X" && this._oItem === oItem) {
				this.getOwnerComponent().listBack = "";
				this.getRouter().getTargets().display("object");
				return;
			}

			this._oItem = oItem;
			window.list_item = oItem;
			var bReplace = false;
			this.getRouter().navTo("object", {
					WERKS: oItem.getBindingContext().getProperty("WERKS"),
					LABEL_NUM: oItem.getBindingContext().getProperty("LABEL_NUM")
				},
				bReplace);

			if (Device.system.phone) {
				this.getRouter().getTargets().display("object");
			}

			this.getModel("screen").setProperty("/detailPath", {
					WERKS: oItem.getBindingContext().getProperty("WERKS"),
					LABEL_NUM: oItem.getBindingContext().getProperty("LABEL_NUM")
				}

			);

			this.getOwnerComponent().oAppControl.hideMaster();
		},

		//		//_showEmty: function() {
		//
		//		},

		/**
		 * Sets the item count on the master list header
		 * @param {integer} iTotalItems the total number of items in the list
		 * @private
		 */
		_updateListItemCount: function (iTotalItems) {
			var sTitle;
			sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
			this.getModel("masterView").setProperty("/title", sTitle);
		},

		/**
		 * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
		 * @param {string} sFilterBarText the selected filter value
		 * @private
		 */
		_updateFilterBar: function (sFilterBarText) {
			var oViewModel = this.getModel("masterView");
			oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
			oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
		},

		onMasterRTVSearchPress: function (oEvent) {

			this.buildSearchPopup(false);
		},

		buildSearchPopup: function (oInit) {
			// create dialog lazily
			if (!this._oDialog) {
				// create dialog via fragment factory
				this._oDialog = sap.ui.xmlfragment("com.hd.rtvview.view.AdvancedSearch", this);
				sap.ui.getCore().byId('addButton').focus();
				// connect dialog to view (models, lifecycle)
				this.getView().addDependent(this._oDialog);
			}
			if (!oInit) {
				this.getView().bindElement({
					path: "/SearchSet('1')"
				});
			}
			// var regExp = /^[9][8][1][8][1-4][0-9]{12}$/;
			// var that = this;
			if (!oInit) {
				var oSelection = sap.ui.getCore().byId("idSelection");
				var oSelectionLabel = sap.ui.getCore().byId("oSelectionLabel");
				var oDateLabel = sap.ui.getCore().byId("oDateLabel");
				// var oDateRange = sap.ui.getCore().byId("idDateSelection");
				// var oSearchBtn = sap.ui.getCore().byId("addButton");
				var oAuthModel = this.getOwnerComponent().getModel("oAuthModel").getData();
				if (oAuthModel) {
					var oPSCUser = oAuthModel.results[0].PSC_User;
				}

				if (oPSCUser === 'Y') {
					oSelection.setVisible(true);
					oSelectionLabel.setVisible(true);
					oDateLabel.setRequired(true);
					// if (oDateRange.getValue() === "") {
					// 	oDateRange.setValueState("Error");
					// } else {
					// 	oDateRange.setValueState("None");
					// }
					// oSearchBtn.setEnabled(false);
				} else {
					oSelection.setVisible(false);
					oSelectionLabel.setVisible(false);
					oDateLabel.setRequired(false);
				}
			}

			if (oInit === false) {
				this._oDialog.open();
			}

		},

		onDialogRTVBackPress: function (evt) {
			var oFilterApplied = this.getView().byId("filterBar");
			if (!oFilterApplied) {
				this.onDialogRTVResetPress();
				this._oDialog.close();
			} else {
				this._oDialog.close();
			}
		},

		cleanDialogFields: function () {
			var article = sap.ui.getCore().byId("idArticle");
			var vendor = sap.ui.getCore().byId("idVendor");
			var date = sap.ui.getCore().byId("idDateSelection");
			var origin = sap.ui.getCore().byId("idOriginCode");
			var order = sap.ui.getCore().byId("idOrder");
			var status = sap.ui.getCore().byId("idStatusCode");

			article.setProperty("value", "");
			origin.setProperty("selectedKey", "");
			status.setProperty("selectedKey", "");
			vendor._oControl.edit.setProperty("value", "");
			date.setProperty("dateValue", "");
			date.setProperty("secondDateValue", "");
			order.setProperty("value", "");
		},

		onDialogRTVSearchPress: function (evt) {
			this.getRouter().navTo("master", {}, true);
			var article = sap.ui.getCore().byId("idArticle");
			var vendor = sap.ui.getCore().byId("idVendor");
			var date = sap.ui.getCore().byId("idDateSelection");
			var origin = sap.ui.getCore().byId("idOriginCode");
			var order = sap.ui.getCore().byId("idOrder");
			var status = sap.ui.getCore().byId("idStatusCode");
			var filters = [];
			var erdat1 = date.getProperty("dateValue");
			var erdat2 = date.getProperty("secondDateValue");
			var oAuthModel = this.getOwnerComponent().getModel("oAuthModel"),
				oAuthData = oAuthModel.getData();
			if (oAuthData.results[0].PSC_User === "Y") {
				//Validate mandatory Created on Date field
				if (date.getValue() === "") {
					MessageToast.show(this.getResourceBundle().getText("EnterCreatedOnDate"));
					return;
				} else {
					var diffOfDays = Math.ceil((erdat2 - erdat1) / (1000 * 60 * 60 * 24));
				}
				if (diffOfDays > 90) {
					MessageToast.show(this.getResourceBundle().getText("EnterCreatedOnDate"));
					return;
				}

				//Start ****Store Selection for PSC
				var oSelection = sap.ui.getCore().byId("idSelection");
				var oRegion = sap.ui.getCore().byId("idRegion").getSelectedItem().getKey();
				var oDist = sap.ui.getCore().byId("idDistrict").getSelectedItem().getKey();
				var oStore = sap.ui.getCore().byId("idStore").getValue().slice(0, 4),
					oSelKey = oSelection.getSelectedKey(),
					oFilterLabel = this.getView().byId("filterBar");
				//If any of 3 selection is selected
				// if ((oSelKey === "1") || (oSelKey === "2") || (oSelKey === "3")) {
				// 	//if all there values are blank, ask user to selet inputs
				// 	if ((oRegion === "") && (oDist === "") && (oStore === "")) {
				// 		MessageToast.show(this.getResourceBundle().getText("EnterSearchCriterias"));
				// 		return;
				// 	} else {
				// 		//If any of the store hireracy , date is mandatory
				// 		if ((erdat1 === "") || (erdat1 === null)) {
				// 			MessageToast.show(this.getResourceBundle().getText("DateMandatory"));
				// 			return;
				// 		}
				// 	}
				// }
				//End ****Store Selection for PSC
				//Get all stores
				if (oSelKey === "1") {
					if (oRegion !== "") {
						filters.push(new Filter("SELKEY", sap.ui.model.FilterOperator.EQ, oSelKey));
						filters.push(new Filter("SELVAL", sap.ui.model.FilterOperator.EQ, oRegion));
					}

				} else if (oSelKey === "2") {
					if (oDist !== "") {
						filters.push(new Filter("SELKEY", sap.ui.model.FilterOperator.EQ, oSelKey));
						filters.push(new Filter("SELVAL", sap.ui.model.FilterOperator.EQ, oDist));
					}

					//If store is selected just pass all the stores
				} else if (oSelKey === "3") {
					if (oStore !== "") {
						filters.push(new Filter("SELKEY", sap.ui.model.FilterOperator.EQ, oSelKey));
						filters.push(new Filter("SELVAL", sap.ui.model.FilterOperator.EQ, oStore));
					}

					// aFilters.push(new Filter("Werks", sap.ui.model.FilterOperator.EQ, oSelVal));
				}
				//End ****Store Selection for PSC
			}
			if (article.getValueState() === sap.ui.core.ValueState.Error) {
				MessageToast.show(this.getResourceBundle().getText("EnterValidArticleUpcNumber"));
				return;
			}

			if (vendor.getValueState() === sap.ui.core.ValueState.Error) {
				MessageToast.show(this.getResourceBundle().getText("EnterValidVendorNumber"));
				return;
			}

			if (order.getValueState() === sap.ui.core.ValueState.Error) {
				MessageToast.show(this.getResourceBundle().getText("EnterValidOrderNumber"));
				return;
			}

			var art = article.getProperty("value");
			var art1 = art.replace(/^0+/, '');
			if (art !== "") {
				while (art.length < 18) art = "0" + art;

				filters.push(new Filter("EAN11", FilterOperator.EQ, art1));
				filters.push(new Filter("MATNR", FilterOperator.EQ, art));
			}

			var orig = origin.getProperty("selectedKey");
			if (orig !== "") {
				filters.push(new Filter("ORIGIN_COD", FilterOperator.EQ, orig));
			}

			var sta = status.getProperty("selectedKey");

			if (sta !== "") {
				filters.push(new Filter("STATUS", FilterOperator.EQ, sta));
			}

			var vnd = vendor._oControl.edit.getProperty("value");
			if (vnd !== "") {
				while (vnd.length < 10) vnd = "0" + vnd;
				filters.push(new Filter("LIFNR", FilterOperator.EQ, vnd));
			}

			// var erdat1 = date.getProperty("dateValue");
			if (erdat1 !== "" && erdat1 !== null) {
				var date1 = new Date(erdat1);
				var d1 = date1.getFullYear() + "-" + ("0" + (date1.getMonth() + 1)).slice(-2) + "-" + ('0' + date1.getDate()).slice(-2) +
					"T00:00:00";
				var day1 = d1.slice(0, 4) + d1.slice(5, 7) + d1.slice(8, 10);

			}

			if (erdat2 !== "" && erdat2 !== null) {
				var date2 = new Date(erdat2);
				var d2 = date2.getFullYear() + '-' + ('0' + (date2.getMonth() + 1)).slice(-2) + '-' + ('0' + date2.getDate()).slice(-2) +
					'T00:00:00';
				var day2 = d2.slice(0, 4) + d2.slice(5, 7) + d2.slice(8, 10);
				filters.push(new Filter("ERDAT", FilterOperator.BT, day1, day2));
			}

			var ord = order.getProperty("value");
			if (ord !== "") {
				while (ord.length < 10) {
					ord = "0" + ord;
				}
				filters.push(new Filter("COM_VBELN", FilterOperator.EQ, ord));
				filters.push(new Filter("REF_VBELN", FilterOperator.EQ, ord));
			}

			if (filters.length === 0) {
				MessageToast.show(this.getResourceBundle().getText("EnterSearchCriterias"));
			} else {
				if (oAuthData.results[0].PSC_User === "Y") {
					//Show the Label
					oFilterLabel.setVisible(true);
				}
				// if (filters.length < 2) {
				// 	MessageToast.show(this.getResourceBundle().getText("EnterSearchCriterias"));
				// 	return;
				// }
				this._oDialog.close();
				// filters.push(new Filter("WERKS", FilterOperator.EQ, this.getOwnerComponent().site));
				this._oList.removeSelections();
				var list = this.byId("list");
				var b = list.getBindingInfo("items");
				var oModel = this.getModel();
				oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.InlineRepeat);
				b.filters = filters;
				b.path = "/LabelSet";
				// window.filters = filters;
				this._iDialogClosing = true;
				this.getView().setBusy(true);
				// this.onRefresh();
				list.bindItems(b);
				var oViewModel = this.getModel("masterView");
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataFoundText"));
				this.byId("searchField").setProperty("value", "");
			}
			this.getView().setBusy(false);
			// this.onDialogRTVResetPress();
		},
		onClearFilter: function () {
			this.getRouter().navTo("master", {}, true);
			var oList = this.byId("list"),
				aFilters = [];
			var oBinding = oList.getBinding("items");
			oBinding.filter(aFilters, "Application");
			this.onDialogRTVResetPress();
			//filter label text
			var oFilterLabel = this.getView().byId("filterBar");
			//Show the Label
			oFilterLabel.setVisible(false);
		},

		callArticleSetOData: function (successFnc, errorFnc) {
			var that = this,
				articleFld = sap.ui.getCore().byId("idArticle"),
				article = articleFld.getValue();

			var aFilters = [
				new Filter("SEARCH_UPC_ART", "EQ", article)
			];

			that._oDialog.setBusy(true);

			this.getModel().read("/ArticleSet", {
				filters: aFilters,
				success: function (oData) {
					that._oDialog.setBusy(false);
					if (oData.results[0].MATNR !== "") {
						articleFld.setValue(oData.results[0].MATNR);
						articleFld.setValueState(sap.ui.core.ValueState.None).setValueStateText("");

					} else {
						articleFld.setValueState(sap.ui.core.ValueState.Error).setValueStateText(that.getResourceBundle().getText(
							"EnterValidArticleUpcNumber"));
						MessageToast.show(that.getResourceBundle().getText("EnterValidArticleUpcNumber"));
					}
					successFnc(oData);
				},
				error: function (oError) {
					that._oDialog.setBusy(false);
					articleFld.setValueState(sap.ui.core.ValueState.Error).setValueStateText(that.getResourceBundle().getText(
						"EnterValidArticleUpcNumber"));

					errorFnc(oError);
				}
			});
		},

		onLabelLiveChange: function (evt) {
			var fld = evt.getSource();
			if (evt.getParameter("value").slice(-1) !== " ") {
				var value = evt.getParameter("value").replace(/[^\d]/g, "");

				fld.updateDomValue(value);
				fld.setValueState(ValueState.None);
			}
		},

		onArticleChange: function (evt) {
			var articleFld = evt.getSource();
			var liveValue = articleFld.getValue();
			if (liveValue.length !== 0) {
				this._oDialog.setBusy(true);
				articleFld.setValue(liveValue);

				this.callArticleSearch(articleFld);
			} else {
				articleFld.setValueState(sap.ui.core.ValueState.None);
				articleFld.setValueStateText("");
			}
		},

		callArticleSearch: function (articleFld) {
			var that = this,
				successFnc = function (oData) {},

				errorFnc = function (oError) {
					MessageToast.show(that.getResourceBundle().getText("EnterValidArticleUpcNumber"));
				};

			this.callArticleSetOData(successFnc, errorFnc);
		},

		smartInit1: function (oEvent) {
			oEvent.getSource()._oControl.edit.setProperty("type", sap.m.InputType.Text);
			oEvent.getSource()._oControl.edit.setProperty("maxLength", 16);
			oEvent.getSource()._oControl.edit.setProperty("startSuggestion", 3);
		},

		onArtChange: function (evt) {
			var fld = evt.getSource();
			this._fld2 = fld;
			var liveValue = fld.getValue();
			var dValue = liveValue.replace(/[^\d]/g, "");

			if (liveValue.length === 0) {
				fld.setValueState(sap.ui.core.ValueState.None);
				fld.setValueStateText("");
			} else if (liveValue.length !== 10 || liveValue !== dValue) {
				fld.setValueState(sap.ui.core.ValueState.Error);
				fld.setValueStateText(this.getResourceBundle().getText("EnterValidArticleUpcNumber"));
				MessageToast.show(this.getResourceBundle().getText("EnterValidArticleUpcNumber"));
			} else {
				fld.setValueState(sap.ui.core.ValueState.None);
				fld.setValueStateText("");
			}
		},

		onOrderChange: function (evt) {
			var fld = evt.getSource();
			this._fld3 = fld;
			var liveValue = fld.getValue();
			var dValue = liveValue.replace(/[^\d]/g, "");

			if (liveValue.length === 0) {
				fld.setValueState(sap.ui.core.ValueState.None);
				fld.setValueStateText("");
			} else if (liveValue.length !== 10 || liveValue !== dValue) {
				fld.setValueState(sap.ui.core.ValueState.Error);
				fld.setValueStateText(this.getResourceBundle().getText("EnterValidOrderNumber"));
				MessageToast.show(this.getResourceBundle().getText("EnterValidOrderNumber"));
			} else {
				fld.setValueState(sap.ui.core.ValueState.None);
				fld.setValueStateText("");
			}
		},

		onLabelsChange: function (evt) {
			var fld = evt.getSource();
			this._fld4 = fld;
			var lVal = fld.getValue();
			if (lVal.length === 0) {
				fld.setValueState(sap.ui.core.ValueState.None);
				fld.setValueStateText("");
				return;
			}

			var array = lVal.split(" ");
			for (var i = 0; i < array.length; i++) {
				var liveValue = array[i];

				var dValue = liveValue.replace(/[^\d]/g, "");

				if (liveValue.length === 0) {
					fld.setValueState(sap.ui.core.ValueState.None);
					fld.setValueStateText("");
				} else if (liveValue.length !== 17 || liveValue !== dValue) {
					fld.setValueState(sap.ui.core.ValueState.Error);
					fld.setValueStateText(liveValue + " " + this.getResourceBundle().getText("NotValidLabel"));
					MessageToast.show(this.getResourceBundle().getText("EnterValidLabel"));
					return;
				} else {
					fld.setValueState(sap.ui.core.ValueState.None);
					fld.setValueStateText("");
				}
			}
		},
		// onOriginChange: function(args) {
		// 	var oAuthModel = this.getOwnerComponent().getModel("oAuthModel"),
		// 		oAuthData = oAuthModel.getData(),
		// 		oSearchBtn = sap.ui.getCore().byId("addButton"),
		// 		oOrigin = args.getParameters().selectedItem.getKey();
		// 		if(oOrigin !== ""){
		// 			oSearchBtn.setEnabled(true);
		// 		} else {
		// 			oSearchBtn.setEnabled(false);
		// 		}
		// },

		// onStatusChange: function(args){
		// 		var oAuthModel = this.getOwnerComponent().getModel("oAuthModel"),
		// 		oAuthData = oAuthModel.getData(),
		// 		oSearchBtn = sap.ui.getCore().byId("addButton"),
		// 		oStatus = args.getParameters().selectedItem.getKey();
		// 		if(oStatus !== ""){
		// 			oSearchBtn.setEnabled(true);
		// 		} else {
		// 			oSearchBtn.setEnabled(false);
		// 		}

		// },

		onDialogRTVResetPress: function (args) {
			var article = sap.ui.getCore().byId("idArticle");
			var vendor = sap.ui.getCore().byId("idVendor");
			var date = sap.ui.getCore().byId("idDateSelection");
			var origin = sap.ui.getCore().byId("idOriginCode");
			var order = sap.ui.getCore().byId("idOrder");
			var status = sap.ui.getCore().byId("idStatusCode");
			var oRegionVal = sap.ui.getCore().byId("idRegion");
			var oDistrictVal = sap.ui.getCore().byId("idDistrict");
			var oStoreVal = sap.ui.getCore().byId("idStore");
			var oSelection = sap.ui.getCore().byId("idSelection");
			var oAuthModel = this.getOwnerComponent().getModel("oAuthModel"),
				oAuthData = oAuthModel.getData();

			oRegionVal.setVisible(false);
			oDistrictVal.setVisible(false);
			oStoreVal.setVisible(false);
			oSelection.setSelectedKey("0");
			oRegionVal.setSelectedKey("");
			oDistrictVal.setSelectedKey("");
			oStoreVal.setValue("");

			article.setValue("");
			origin.setSelectedKey("");
			status.setSelectedKey("");
			//vendor._oControl.edit.setProperty("value", "");
			date.setDateValue(null);
			date.setSecondDateValue(null);
			// if (oAuthData.results[0].PSC_User === "Y") {
			// 	date.setValueState("Error");
			// } else {
			// 	date.setValueState("None");
			// }
			order.setValue("");
			var oModel = this.getModel();
			oModel.setProperty("/SearchSet('1')/LIFNR", "");
			oModel.updateBindings("true");
			this.getView().setBusy(false);

		},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.hd.rtvview.view.LabelDetails
		 */
		onExit: function () {
			this.newStyleElement.html("");
			this.newStyleElement1.html("");
		},

		onBeforeFirstShow: function (that) {
			if (this._firstShow === "X") {
				this._firstShow = "";
				this.nav_back_go = -1;
				if (window.rtv_back_navigation === "X") {
					var list = this.byId("list");
					if (window.scrol_actual > 20) {
						list.setGrowingThreshold(window.scrol_actual);
					}
					var b = list.getBindingInfo("items");
					b.filters = window.filters;
					b.path = "/ViewLabelSet";
					this.getView().setBusy(true);
					list.bindItems(b);
					this.selected_item = window.list_item;
					window.rtv_back_navigation = null;
					this.crossAppNavigation = true;
					this.skipDetailsCleaning = true;
				} else {
					var hash = window.location.hash.split("/");
					if (hash[1] === "object" && hash[3] !== undefined && !window.rtvmodel) {
						var sQuery = hash[3];
						var sSite = hash[2];
						this.getOwnerComponent().site = sSite;
						var filters = [];
						filters.push(new Filter("LABEL_NUM", FilterOperator.EQ, sQuery));
						filters.push(new Filter("WERKS", FilterOperator.EQ, sSite));
						var list = this.byId("list");
						var b = list.getBindingInfo("items");
						b.filters = filters;
						// b.path = "/ViewLabelSet";
						// window.filters = filters;
						// this.getView().setBusy(true);
						// list.bindItems(b);
						// this.nav_back_go = -2;
						// this.crossAppNavigation = true;
						// this.skipDetailsCleaning = true;
						// b.filters = filters;
				        b.path = "/LabelSet";
				        // this._oList.removeSelections();
				        window.filters = filters;
						this.getView().setBusy(true);
				        var oModel = this.getOwnerComponent().getModel();
				        oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.InlineRepeat);
				        list.bindItems(b);
				        this.nav_back_go = -2;
						this.crossAppNavigation = true;
						this.skipDetailsCleaning = true;
					}
				}
			} else if (this.crossAppNavigation) {
				this.crossAppNavigation = false;
			} else {
				this.skipDetailsCleaning = false;
			}

			jQuery.sap.delayedCall(500, this, function () {
				this.getView().byId("searchField").focus();
				this.onVKeypadHide();
			}.bind(this));

		},

		_AuthorizationAccess: function (firstItem) {
			var oModel = this.getOwnerComponent().getModel();
			var oAuthModel = this.getOwnerComponent().getModel("oAuthModel"),
				oAuthData = oAuthModel.getData();
			if (!oAuthData.results) {
				sap.ui.core.BusyIndicator.show();
				var that = this;
				oModel.read("/UserAuthSet", {
					success: function (oData, response) {
						oAuthModel.setData(oData);
						// sap.ui.core.BusyIndicator.hide();
						if (firstItem) {
							sap.ui.core.BusyIndicator.hide();
							that._showDetail(firstItem);
						}
						if (oData.results[0].PSC_User === "Y") {
							that.getStoreheireracy();
						} else {
							sap.ui.core.BusyIndicator.hide();
						}
					},
					error: function (oError) {
						sap.ui.core.BusyIndicator.hide();
					}
				});
			} else {
				this._showDetail(firstItem);
			}
		},
		getStoreheireracy: function () {
			var oModel = this.getModel();
			var StoreHierarcy = this.getOwnerComponent().getModel("StoreHierarcy");
			var that = this;
			oModel.read("/StoreHierarchySet", {
				urlParameters: {
					"$expand": "Store,Dist,Region"
				},
				success: function (oData, response) {
					sap.ui.core.BusyIndicator.hide();
					var oRegionModel = that.getOwnerComponent().getModel("oRegionModel"),
						oDistrictModel = that.getOwnerComponent().getModel("oDistrictModel"),
						oStoreModel = that.getOwnerComponent().getModel("oStoreModel");

					sap.ui.core.BusyIndicator.hide();
					StoreHierarcy.setData(oData);

					oRegionModel.setData(oData.results[0].Region);
					oDistrictModel.setData(oData.results[0].Dist);
					oStoreModel.setData(oData.results[0].Store);

				},
				error: function (oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageToast.show(that.getResourceBundle().getText("StoreHireracy"));
				}
			});

		},

		onAfterRendering: function () {
			var oModel = this.getOwnerComponent().getModel();
			oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.InlineRepeat);
			var commentModel = this.getModel("CommentsModel");
			this.getModel().read("/DeleteReasonSet", {
				success: function (oData) {
					commentModel.setProperty("/DeleteReasonSet", oData.results);
					commentModel.updateBindings();
					commentModel.refresh();
				},
				error: function () {}
			});

			if (Device.system.phone) {
				this.getRouter().getTargets().display("master");
			}

			this.buildSearchPopup(true);
		},
		onStoreSelectionChange: function (oEvent) {
			//Get all elements from the screen
			var oSelectedItem = oEvent.getParameters().selectedItem.getKey();
			var oRegionModel = this.getModel("oRegionModel");
			var oRegionVal = sap.ui.getCore().byId("idRegion");
			var oDistrictVal = sap.ui.getCore().byId("idDistrict");
			var oStoreVal = sap.ui.getCore().byId("idStore");
			var DateSelection = sap.ui.getCore().byId("idDateSelection");
			var oSearchBtn = sap.ui.getCore().byId("addButton");

			//No Selection
			if (oSelectedItem === "0") {
				//Hide all drop down for Region/District and Store Input fields
				oRegionVal.setVisible(false);
				oDistrictVal.setVisible(false);
				oStoreVal.setVisible(false);
				//Clear Region/Distrct/Store Values
				oRegionVal.setSelectedKey("");
				oDistrictVal.setSelectedKey("");
				oStoreVal.setValue("");
				DateSelection.setValueState("None");
				oSearchBtn.setEnabled(true);

				//Region selection
			} else if (oSelectedItem === "1") {
				//Get keys of initial selection
				var aRtos = [];
				var oNewRto = {};
				oNewRto.key = "09";
				oNewRto.text = this.getResourceBundle().getText("East");
				aRtos.push(oNewRto);
				oNewRto = {};
				oNewRto.key = "32";
				oNewRto.text = this.getResourceBundle().getText("West");
				aRtos.push(oNewRto);
				oRegionModel.setProperty("/Region", aRtos);
				oRegionVal.setVisible(true);
				oDistrictVal.setVisible(false);
				oStoreVal.setVisible(false);
				oRegionVal.setSelectedKey("");
				oDistrictVal.setSelectedKey("");
				oStoreVal.setValue("");

			} else if (oSelectedItem === "2") {

				oRegionVal.setVisible(false);
				oDistrictVal.setVisible(true);
				oStoreVal.setVisible(false);
				oRegionVal.setSelectedKey("");
				oDistrictVal.setSelectedKey("");
				oStoreVal.setValue("");

			} else if (oSelectedItem === "3") {

				oRegionVal.setVisible(false);
				oDistrictVal.setVisible(false);
				oStoreVal.setVisible(true);
				oRegionVal.setSelectedKey("");
				oDistrictVal.setSelectedKey("");
				oStoreVal.setValue("");
			}

		},
		handleStoreSuggest: function (oEvent) {
			var sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			aFilters.push(new Filter("Site", sap.ui.model.FilterOperator.StartsWith, sTerm));
			oEvent.getSource().getBinding("suggestionItems").filter(aFilters);

		},
		onRegionChange: function (oEvent) {
			var oKey = oEvent.getParameters().selectedItem.getKey();
			var DateSelection = sap.ui.getCore().byId("idDateSelection");
			var oSearchBtn = sap.ui.getCore().byId("addButton");
			var oValue = DateSelection.getValue();
			// if (oKey !== "") {
			// 	if (oValue === "") {
			// 		DateSelection.setValueState("Error");
			// 		oSearchBtn.setEnabled(false);
			// 	} else {
			// 		DateSelection.setValueState("None");
			// 		oSearchBtn.setEnabled(true);
			// 	}
			// } else {
			// 	DateSelection.setValueState("None");
			// 	oSearchBtn.setEnabled(true);
			// }

		},
		onDistrictChange: function (oEvent) {
			var DateSelection = sap.ui.getCore().byId("idDateSelection");
			var oKey = oEvent.getParameters().selectedItem.getKey();
			var oSearchBtn = sap.ui.getCore().byId("addButton");
			var oValue = DateSelection.getValue();
			// if (oKey !== "") {
			// 	if (oValue === "") {
			// 		DateSelection.setValueState("Error");
			// 		oSearchBtn.setEnabled(false);
			// 	} else {
			// 		DateSelection.setValueState("None");
			// 		oSearchBtn.setEnabled(true);
			// 	}
			// } else {
			// 	DateSelection.setValueState("None");
			// 	oSearchBtn.setEnabled(true);
			// }

		},
		onStoreInp: function (oEvent) {

		},
		//on Store Change
		onStoreChange: function (oEvent) {
			var DateSelection = sap.ui.getCore().byId("idDateSelection");
			var oSearchBtn = sap.ui.getCore().byId("addButton");
			var oKey = oEvent.getParameters().selectedItem.getText().slice(0, 4);
			var oValue = DateSelection.getValue();
			// if (oKey !== "") {
			// 	if (oValue === "") {
			// 		DateSelection.setValueState("Error");
			// 		oSearchBtn.setEnabled(false);
			// 	} else {
			// 		DateSelection.setValueState("None");
			// 		oSearchBtn.setEnabled(true);
			// 	}
			// } else {
			// 	DateSelection.setValueState("None");
			// 	oSearchBtn.setEnabled(true);
			// }

		},
		onDateRangeSelection: function (oEvent) {
			// var DateSelection = sap.ui.getCore().byId("idDateSelection");
			// var oKey = oEvent.getParameters().newValue;

			var diffOfDays = Math.ceil((oEvent.getParameter("to") - oEvent.getParameter("from")) / (1000 * 60 * 60 * 24));
			if (diffOfDays > 90) {
				MessageToast.show(this.getResourceBundle().getText("EnterCreatedOnDate"));
			}
			// var oSearchBtn = sap.ui.getCore().byId("addButton");
			//Start ****Store Selection for PSC
			// var oSelection = sap.ui.getCore().byId("idSelection");
			// var oRegion = sap.ui.getCore().byId("idRegion").getSelectedItem().getKey();
			// var oDist = sap.ui.getCore().byId("idDistrict").getSelectedItem().getKey();
			// var oStore = sap.ui.getCore().byId("idStore").getValue().slice(0, 4),
			// 	oSelKey = oSelection.getSelectedKey();

			//If any of 3 selection is selected
			// if ((oSelKey === "1") || (oSelKey === "2") || (oSelKey === "3")) {
			// 	//if all there values are blank, ask user to selet inputs
			// 	if ((oRegion === "") && (oDist === "") && (oStore === "")) {
			// 		if (oKey !== "") {
			// 			DateSelection.setValueState("Error");
			// 			oSearchBtn.setEnabled(false);
			// 		} else {
			// 			DateSelection.setValueState("None");
			// 			oSearchBtn.setEnabled(true);
			// 		}
			// 	} else {
			// 		if (oKey === "") {
			// 			DateSelection.setValueState("Error");
			// 			oSearchBtn.setEnabled(false);
			// 		} else {
			// 			DateSelection.setValueState("None");
			// 			oSearchBtn.setEnabled(true);
			// 		}
			// 	}
			// } else {
			// 	DateSelection.setValueState("None");
			// 	oSearchBtn.setEnabled(true);
			// }
			//End ****Store Selection for PSC

		}

	});

});