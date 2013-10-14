/**
 * Created by Lihe on 13-10-12.
 */

module.exports =  function(app){
    app.get('/test/query', function(req, res){
        var querySimpleParam = req.query.name;
        //var querySimpleParam = req.param('name');
        var queryMapParam = req.query.condition.study;

        res.send('Query For Param name: '+querySimpleParam+'        Query For Map Param Condition[study]: '+queryMapParam);
    });

    app.post('/test/query', function(req, res){
        var querySimpleParam = req.body.name;
        //var querySimpleParam = req.param('name');
        var queryMapParam = req.body.condition.study;

        res.send('Query For Param name: '+querySimpleParam+'        Query For Map Param Condition[study]: '+queryMapParam);
    });

    app.get('/test/query/:name', function(req, res){
        var paramName = req.params.name;
        //var querySimpleParam = req.param('name');   //param can do everything
        res.send('You are looking for '+paramName);
    });
};
