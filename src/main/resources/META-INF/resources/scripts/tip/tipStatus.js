if (!TIP) var TIP = {};

(function(){
    TIP.setStatus = function(clicked,formID) {
        var projectId = $(clicked).data('projectid');
        var subjectId = $(clicked).data('subjectid');
        var sessionId = $(clicked).data('sessionid');
        var statusForm = document.getElementById(formID);
        var updateData = $(statusForm).serialize();
        var currentStatus = $(clicked).data('currentstatus');
        var modalHeight = 200;

        TIP.setStatus.action = function(obj) {
            // get value from modal notes field, if it exists
            var tipStatusNotes = $(obj.$modal).find('.tipStatusNotesField').val();
            if (tipStatusNotes) updateData += '&xnat%3AexperimentData%2Ffields%2Ffield%5Bname%3Dtipstatusnotes%5D%2Ffield='+tipStatusNotes;
            // xmodal.close();

            xmodal.loading.open();
            $.ajax({ url: "/REST/projects/"+projectId+"/subjects/"+subjectId+"/experiments/"+sessionId+"?req_format=form&XNAT_CSRF="+csrfToken, type:"PUT", contentType: "application/x-www-form-urlencoded; charset=UTF-8", data: updateData })
                .done(function(){
                    xmodal.loading.close();
                    xmodal.message({content: "Session status updated.", okAction: function(){ xmodal.closeAll(); window.location.reload() } });
                })
                .fail(function(){
                    xmodal.loading.close();
                    xmodal.alert("Sorry, this request failed for some reason.")
                })
                .always(function(){ });
        };

        if (!projectId || !subjectId || !sessionId || !updateData) {
            xmodal.alert("Sorry, a key parameter is missing and this action cannot be performed.");
            return;
        } else  {
            var modalContent;
            if (currentStatus && currentStatus.toLowerCase() === "active") {
                modalContent = '<p>Remove this session from your active project queue?</p>';
                modalContent += '<p><label>Notes:</label><textarea class="tipStatusNotesField" rows="3"></textarea></p>';
                modalHeight = 240;

            } else {
                modalContent = "Add this session to your active project queue?";
            }
            xmodal.confirm({
                content: modalContent,
                cancelLabel: "Cancel",
                cancelAction: "return",
                className: "friendlyForm",
                height: modalHeight,
                okAction: TIP.setStatus.action,
                okClose: false
            });
        }
    };

    TIP.setValidationStatus = function(clicked,formID) {
        // store value of status in the form
        $('#tipStatusField').val(validationStatus);

        var projectId = $(clicked).data('projectid');
        var subjectId = $(clicked).data('subjectid');
        var sessionId = $(clicked).data('sessionid');
        var assessorId = $(clicked).data('assessorid');
        var validationStatus = $(clicked).data('status');
        var statusForm = document.getElementById(formID);
        var updateData = $(statusForm).serialize();

        TIP.getSubjectId = function() {
            xmodal.loading.open();
            $.getJSON("/REST/experiments/"+sessionId+"?format=json")
                .success(function(data){
                    subjectId = data.items[0].data_fields.subject_ID;
                    TIP.openValidationModal();
                });
        };

        TIP.openValidationModal = function() {
            var modalContent = '<p>After review, you are going to mark this QC as '+validationStatus+'. Is that correct?</p>';
            modalContent += '<p><label>Notes</label><br /><textarea id="validationNotesInput"></textarea></p>';

            xmodal.confirm({
                content: modalContent,
                cancelLabel: "Cancel",
                cancelAction: "return",
                okAction: function() {
                    updateData += '&tip%3AbeniceQC%2Fvalidation%2Fnotes=' + $('#validationNotesInput').html();
                    TIP.setValidationStatus.action();
                }
            });
        };

        TIP.setValidationStatus.action = function() {
            xmodal.loading.open();
            $.ajax({ url: "/REST/projects/"+projectId+"/subjects/"+subjectId+"/experiments/"+sessionId+"/assessors/"+assessorId+"?req_format=form&XNAT_CSRF="+csrfToken, type:"PUT", contentType: "application/x-www-form-urlencoded; charset=UTF-8", data: updateData })
                .done(function(){
                    xmodal.loading.close();
                    xmodal.message({
                        content: "QC status set to '" + validationStatus + "'.",
                        okAction: function(obj){
                            xmodal.close(obj.$modal)
                        }
                    });
                })
                .fail(function(){
                    xmodal.loading.close();
                    xmodal.alert("Sorry, this request failed for some reason.")
                })
                .always(function(){ });
        };

        if (!projectId || !sessionId || !assessorId || !updateData) {
            console.log(projectId, sessionId, assessorId, updateData);
            xmodal.alert("Sorry, a key parameter is missing and this action cannot be performed.");
            return;
        }else if (!subjectId) {
            TIP.getSubjectId();
        } else  {
            TIP.openValidationModal();
        }
    }
})();