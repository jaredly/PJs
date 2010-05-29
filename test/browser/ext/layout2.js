
Ext.onReady(function(){
    new Ext.Viewport({
        layout: 'border',
        items: [
        {
            region: 'north',
            height: 30,
            margins: '0 0 5 0',
            items: {
                xtype: 'toolbar',
                items: [{
                        text:'Project',
                        menu:{
                            items:[
                                {text: 'Open'},
                                {text: 'Clone'},
                                {text: 'SaveAs'},
                                {text: 'Export'}
                            ]
                        }
                    }, {
                        text: 'View',
                        menu: {
                            items: [
                                { text: 'Flash - Preview' },
                                { text: 'HTML5 - Preview' }
                            ]
                        }
                    }, {
                        text: 'New Sprite'
                    }, {
                        text: 'New Object'
                    }, {
                        text: 'New Map'
                    }
                ]
            }
        }, {
            region: 'south',
            split: true,
            height: 200,
            minSize: 100,
            maxSize: 300,
            // collapsible: true,
            margins: '0 0 0 0', 
            items: {
                xtype: 'tabpanel',
                border: false,
                activeTab: 0,
                tabPosition: 'top',
                items: [{
                    title: 'Project Info',
                    html: '<p> A form or such goes here</p>'
                }, {
                    title: 'Browse Media',
                    html: '<p>this will probably have sub-tabs [maybe] for Images, Objects, and Maps.</p>'
                }]
            }
        }, /*{ // I don't think I need an east
            region: 'east',
            title: 'Assets',
            collapsible: true,
            split: true,
            width: 225,
            minSize: 175,
            maxSize: 400,
            margins: '0 5 0 0',
            layout: 'fit',
            items: {
                xtype: 'tabpanel',
                border: false, // already wrapped so don't add another border
                activeTab: 1, // second tab initially active
                tabPosition: 'bottom',
                items: [{
                    html: '<p>A TabPanel component can be a region.</p>',
                    title: 'A Tab',
                    autoScroll: true
                }, new Ext.grid.PropertyGrid({
                    title: 'Property Grid',
                    closable: true,
                    source: {
                        "(name)": "Properties Grid",
                        "grouping": false,
                        "autoFitColumns": true,
                        "productionQuality": false,
                        "created": new Date(Date.parse('10/15/2006')),
                        "tested": false,
                        "version": 0.01,
                        "borderWidth": 1
                    }
                })]
            }
        }, */{
            region: 'west',
            id: 'west-panel', // see Ext.getCmp() below
            title: 'Assets',
            split: true,
            width: 200,
            minSize: 175,
            maxSize: 400,
            collapsible: true,
            margins: '0 0 0 5',
            // layout: 'vbox',
            layoutConfig: {
                pack:'start',
                align:'stretch'
            },
            items: [{
                contentEl: 'west',
                title: 'Sprites',
                collapsible: true,
                autoHeight:true,
                border: false,
                iconCls: 'nav' // see the HEAD section for style used
            }, {
                title: 'Objects',
                collapsible: true,
                html: '<p>Some settings in here.</p>',
                border: false,
                iconCls: 'settings'
            }, {
                title: 'Maps',
                collapsible: true,
                html: 'Yeha!',
                border: false,
                iconCls: 'maps'
            }]
        },
        {
            xtype: 'panel',
            region: 'center',
            layout: 'card',
            id: 'main-content',
            border: false,
            activeItem: 0,
            items: [{
                xtype: 'panel',
                layout: 'border',
                anchor: '-10',
                id: 'image-content',
                border: false,
                items: [{
                    region: 'west',
                    split:true,
                    width: 200,
                    contentEl: 'image-info'
                }, {
                    region: 'center',
                    tbar: [
                    { text: '&nbsp;&nbsp;+&nbsp;&nbsp;' },
                    { text: '&nbsp;&nbsp;-&nbsp;&nbsp;' }
                    ],
                    contentEl: 'image-subimages'
                }]
            }, {
                html:'some stuff'
            }]
        }]
    });
    Ext.get('next').on('click', function(){
        Ext.getCmp('main-content').layout.setActiveItem(1);
    });
});
