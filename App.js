Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
        var initiatives = Ext.create('Rally.data.wsapi.Store', {
            model: 'PortfolioItem/Initiative',
            fetch: ['Children']
        });
        initiatives.load().then({
            success: this.loadFeatures,
            scope: this
        }).then({                          
            success: this.loadParentStories,
            scope: this
        }).then({                          
            success: this.loadChildStories,
            scope: this
        }).then({                          
            success: this.loadTasks,
            failure: this.onFailure,
            scope: this
        }).then({
            success: function(results) {
                //console.log('great success!');
                results = _.flatten(results);
                _.each(results, function(result){
                    console.log(result.data.FormattedID, 'Estimate: ', result.data.Estimate, 'WorkProduct:', result.data.WorkProduct.FormattedID );
                });
                this.makeGrid(results);
            },
            failure: function(error) {
                console.log('oh, noes!');
            },
            scope: this
        });
    },

    loadFeatures: function(initiatives) {
        var promises = [];
        _.each(initiatives, function(initiative) {
            var features = initiative.get('Children');
            if(features.Count > 0) {
                features.store = initiative.getCollection('Children',{fetch: ['Name','FormattedID','UserStories']});
                promises.push(features.store.load());
            }
        });
        return Deft.Promise.all(promises);
    },
    loadParentStories: function(features) {
        features = _.flatten(features);
        var promises = [];
        _.each(features, function(feature) {
            var stories = feature.get('UserStories');
            if(stories.Count > 0) {
                stories.store = feature.getCollection('UserStories', {fetch: ['Name','FormattedID','Children']});
                promises.push(stories.store.load());
            }
        });
        return Deft.Promise.all(promises);
    },
     loadChildStories: function(parentStories) {
        parentStories = _.flatten(parentStories);
        var promises = [];
        _.each(parentStories, function(parentStory) {
            var children = parentStory.get('Children');
            if(children.Count > 0) {
                children.store = parentStory.getCollection('Children', {fetch: ['Name','FormattedID','Tasks']});
                promises.push(children.store.load());
            }
        });
        return Deft.Promise.all(promises);
    },
    loadTasks: function(stories) {
        stories = _.flatten(stories);
        var promises = [];
        _.each(stories, function(story) {
            var tasks = story.get('Tasks');
            if(tasks.Count > 0) {
                tasks.store = story.getCollection('Tasks', {fetch: ['Name','FormattedID','Workproduct','Estimate']});
                promises.push(tasks.store.load());
            }
            else{
                console.log('no tasks');
            }
        });
        return Deft.Promise.all(promises);
    },
    makeGrid:function(tasks){
        var data = [];
        _.each(tasks, function(task){
            data.push(task.data);
        });
        
        _.each(data, function(record){
            record.Story = record.WorkProduct.FormattedID + " " + record.WorkProduct.Name;
        });
        
        this.add({
            xtype: 'rallygrid',
            showPagingToolbar: true,
            showRowActionsColumn: true,
            editable: false,
            store: Ext.create('Rally.data.custom.Store', {
                data: data,
                groupField: 'Story'
            }),
            features: [{ftype:'groupingsummary'}],
            columnCfgs: [
                {
                    xtype: 'templatecolumn',text: 'ID',dataIndex: 'FormattedID',width: 100,
                    tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate'),
                    summaryRenderer: function() {
                        return "Totals"; 
                    }
                },
                {
                    text: 'Name',dataIndex: 'Name'
                },
                {
                    text: 'Estimate',dataIndex: 'Estimate',
                    summaryType: 'sum'
                }
            ]
        });
        
    }
});
