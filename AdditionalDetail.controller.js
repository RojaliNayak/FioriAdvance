/*global location */
sap.ui.define([
	"YRTV_ONE_TILE/YRTV_ONE_TILE/controller/CreateVerify/BaseController",
	"sap/ui/model/json/JSONModel",
	"YRTV_ONE_TILE/YRTV_ONE_TILE/model/Createverify/formatter",
	"sap/ui/core/Item",
	"sap/ui/model/Filter",
	"sap/m/MessageToast",
	"sap/ui/core/CustomData",
	"sap/ui/core/routing/History"
], function(BaseController, JSONModel, formatter, coreItem, Filter, MessageToast, CustomData, History) {
	"use strict";

	return BaseController.extend("YRTV_ONE_TILE.YRTV_ONE_TILE.controller.CreateVerify.AdditionalDetail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			var oView = this.getView();
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0
			});
			this.getRouter().getRoute("articleAdditionalDetail").attachPatternMatched(this._onArticleDetailMatched, this);
			this.setModel(oViewModel, "detailView");
			this.getModel("articleModel");

		},
		
		/**
		 * Event handler  for navigating back.
		 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the master route.
		 * @public
		 */
		onNavBack: function() {
			 
			/*if(this.byId('idEditCOM').getEnabled() && this.byId('idEditCOM').getVisible()) {
				this.getModel('articleModel').getData().Articles[0].Comments = "";	
			}*/
			var app = this.getView().getParent().getParent();
			app.backDetail();
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
		_onArticleDetailMatched: function(oEvent) {
			var oParameters = oEvent.getParameters();
			var onlineCheckStatus = oParameters.arguments.onlineStatus;
			var addtionalDetailModel = this.getOwnerComponent().getModel('addtionalDetailModel');
			var articleModel = this.getOwnerComponent().getModel('articleModel');
			var addtionalDetailModelData = addtionalDetailModel.getData();
			// this.byId('idCommentsFld').setMaxLength(255);
			if (oParameters.name === "articleAdditionalDetail") {
				addtionalDetailModelData.retail = "$" + articleModel.oData.PRICE;
				addtionalDetailModelData.onlineOnly = !!onlineCheckStatus;
			}
		},
		
		initOnKeyPress: function() {
			var addtionalDetailModel = this.getView().getModel("addtionalDetailModel");
			$(document).ready(function() {
				$('.RGAField input').on('copy paste cut',function(e) { 
					var pastedData = e.originalEvent.clipboardData.getData('text');
					if(isNaN(pastedData) || pastedData.indexOf(".") !== -1 || pastedData.indexOf("+") !== -1 || pastedData.indexOf("-") !== -1 || pastedData.indexOf("e") !== -1)
    				{
    					e.preventDefault(); //disable cut,copy,paste 
				
    				}	
    			});
				
				$('.RGAField input').on('keydown', function(e) {
					addtionalDetailModel.setData(e.key);
				});
			});
		},
		
		/*onEditCOMComment: function(oEvent) {
			var txtComment = this.byId('idCommentsFld');
			this.getModel('articleModel').getData().OriginCode = 'xyz';
			oEvent.getSource().setEnabled(false);
			txtComment.setMaxLength(255);
			txtComment.focus();
			txtComment.setEnabled(true);
			txtComment.setValue("");
		},*/
		
		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView");
			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		}
	});

});