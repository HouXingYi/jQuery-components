//index.js
//获取应用实例
var Common = require("../../utils/common.js");
var app = getApp();
Page({
    data: {
        scroll_into_view : "" ,
        isfixed : "" ,
        floor_1_active: "active" ,
        title : "产品详情页",
        land :{} ,
        ticketList: [] ,
        taoPiaoTicketList: [] ,
        isRenderTaoPiaoList: true ,
        imgSrcArr :[]
    },


    /**
     * @method 当点击tab时
     * @param e
     */
    onTabTitleTap: function (e) {
        this.setData({
            scroll_into_view: e.target.dataset.type,
            isfixed : "fixed"
        });
        switch (e.target.dataset.type){
            case "floor_1" :
                this.setData({
                    floor_1_active: "active",
                    floor_2_active: "",
                    floor_3_active: ""
                });
                break;
            case "floor_2" :
                this.setData({
                    floor_1_active: "",
                    floor_2_active: "active",
                    floor_3_active: ""
                });
                break;
            case "floor_3" :
                this.setData({
                    floor_1_active: "",
                    floor_2_active: "",
                    floor_3_active: "active"
                });
                break;
        }
    },


    /**
     * @method 页面滚动时
     * @param e
     */
    onScroll: function (e) {
        var _this = this ;
        if(e.detail.scrollTop >= 214){
            _this.setData({
                isfixed : "fixed"
            })
        }else{
            _this.setData({
                isfixed : ""
            })
        }
    },


    /**
     *  初始化页面
     */
    onLoad: function( opt ) {
        console.log(opt);
        var lid = opt.lid;
        var _this = this;
        //banner，景区信息请求
        Common.request({
            url: "/r/Mall_Product/getLandInfo/",
            data: {
                // lid: "2107"
                lid: lid
            },
            loading: function () {
                Common.showLoading()
            },
            complete: function () {
                Common.hideLoading();
            },
            success: function (res) {
                if(res.code == 200 ){
                    //<br/>替换成“\n”,删除其他标签,多个\n替换成一个\n
                    res.data.jqts = res.data.jqts.replace(/\<br[^\<\>]+\>/g , "\n" );
                    res.data.jqts = res.data.jqts.replace(/\<[^\<\>]+\>/g , "" );
                    res.data.jqts = res.data.jqts.replace(/\n[\s\n]+/g , "\n" );
                    
                    //<br/>替换成“\n”,删除其他标签,多个\n替换成一个\n
                    res.data.jtzn = res.data.jtzn.replace(/\<br[^\<\>]+\>/g , "\n" );
                    res.data.jtzn = res.data.jtzn.replace(/\<[^\<\>]+\>/g , "" );
                    res.data.jtzn = res.data.jtzn.replace(/\n[\s\n]+/g , "\n" );
                    
                    //抽出图片
                    var imgSrcArr = res.data.bhjq.match(/src\=\"[^\"]+\"/g );
                    var srcarr = [];
                    if(imgSrcArr){
                        for(var i= 0 ; i<imgSrcArr.length ; i++){
                            var str = imgSrcArr[i].replace(/src\=\"/g,"")
                            srcarr.push( str.replace(/\"/g,"") )
                        }
                        _this.setData({
                            imgSrcArr : srcarr,
                        })
                    }
                    //<br/>替换成“\n”,删除其他标签,多个\n替换成一个\n
                    res.data.bhjq = res.data.bhjq.replace(/\<br[^\<\>]+\>/g , "\n" );
                    res.data.bhjq = res.data.bhjq.replace(/\<[^\<\>]+\>/g , "" );
                    res.data.bhjq = res.data.bhjq.replace(/\n[\s\n]+/g , "\n" );


                    _this.setData({
                        land : res.data,
                    })

                }else{
                    wx.showModal({
                        title: '提示',
                        content: res.msg,
                        // success: function(res) {
                        //     if (res.confirm) {
                        //     console.log('用户点击确定')
                        //     }
                        // }
                    })
                    
                }
               
            }
        });
        //票列表请求
        Common.request({
            url: "/r/Mall_Product/getTicketList/",
            data: {
                // lid: "2107"
                lid: lid
            },
            loading: function () {
                Common.showLoading()
            },
            complete: function () {
                Common.hideLoading();
            },
            success: function (res) {
                console.log(res);
                _this.setData({
                    ticketList : res.data.list,
                })
            }
        });
        //套票数据
        Common.request({
            url: "/r/Mall_Product/getRelatedPackage/",
            data: {
                // lid: "2107"
                lid: lid
            },
            loading: function () {
                Common.showLoading()
            },
            complete: function () {
                Common.hideLoading();
            },
            success: function (res) {
                console.log(res);
                _this.setData({
                    taoPiaoTicketList : res.data
                });
                if(res.data.length == 0){
                    _this.setData({
                        isRenderTaoPiaoList : false
                    })
                }
            }
        })
    },


    /**
     * onReady
     */
    onReady : function(){
        let that = this;
        wx.setNavigationBarTitle({
            title: that.data.title
        });
    },


    /**
     * @method  点击预订按钮时
     */
    onBookBtnTap: function (e) {
        wx.navigateTo({
            url: '../booking/booking?aid=' + e.target.dataset.aid + '&pid=' + e.target.dataset.pid
        });
    },


    /**
     * 打开地图查看位置
     */
    openMap: function(){
         wx.openLocation({
            latitude: 26.074508,
            longitude: 119.296494,
            scale: 28
        })
    }
});
