jQuery(document).ready(function() {

    // Delete a Selected Entry
    jQuery(document).on('click', 'ul.custom-field-selected-entries li img.remove', function(){
        var obj_id = jQuery(this).parent().attr('id');
        obj_id = obj_id.replace('obj-','');

        var obj_ids = jQuery(this).parent().parent().parent().find('input.selected-entries').val();
        var re = new RegExp(',?'+obj_id);
        obj_ids = obj_ids.replace(re,'');

        // Write the updated list of Selected Entries back to the field.
        jQuery(this).parent().parent().parent().find('input.selected-entries').val( obj_ids );

        // Finally, actually remove the item.
        jQuery(this).parent().remove();
    });

    // Delete a Reciprocal Object
    jQuery(document).on('click', 'ul.custom-field-reciprocal li img.remove', function(){
        var $field = jQuery(this).parent().parent().parent().find('input.reciprocal-object');

        deleteReciprocalAssociation(
            $field.attr('id'),
            $field.val()
        );
    });


    // Objects in the selected entries/pages CF are sortable. After sorting,
    // update the hdiden field with the object IDs.
    jQuery('ul.custom-field-selected-entries').sortable({
        revert: true,
        stop: function(event, ui) {
            var objects = new Array();

            jQuery(this).find('li').each(function(index,value){
                var id = jQuery(this).attr('id');
                id = id.replace('obj-','');
                objects.push(id);
            });

            jQuery(this).parent().find('input.selected-entries').val( objects.join(',') );
        }
    }).disableSelection();

});


// The popup dialog uses this function to insert the Selected Entry, Selected
// Page, or Reciprocal Association.
function insertSelectedObject(obj_title, obj_id, obj_class, obj_permalink, field, blog_id) {
    // Check if this is a reciprocal association, or just a standard Selected
    // Entry/Page.
    if ( jQuery('input#'+field+'.reciprocal-object').length ) {
        // If a reciprocal association already exists, we need to delete it
        // before creating a new association.
        if ( jQuery('input#'+field+'.reciprocal-object').val() ) {
            deleteReciprocalAssociation(
                field,
                jQuery('input#'+field+'.reciprocal-object').val()
            );
            createReciprocalAssociation(
                obj_title,
                obj_id,
                obj_class,
                obj_permalink,
                field,
                blog_id
            );
        }
        // No existing association exists, so just create the new reciprocal
        // entry association.
        else {
            createReciprocalAssociation(
                obj_title,
                obj_id,
                obj_class,
                obj_permalink,
                field,
                blog_id
            );
        }
    }
    // This is just a standard Selected Entries or Selected Pages insert.
    else {
        // Create a list item populated with title, edit, view, and remove links.
        var $li = createObjectListing(
            obj_title,
            obj_id,
            obj_class,
            obj_permalink,
            blog_id
        );

        // Insert the list item with the button, preview, etc into the field area.
        jQuery('ul#custom-field-selected-entries_'+field)
            .append($li)

        var objects = new Array();
        objects[0] = jQuery('input#'+field).val();
        objects.push(obj_id);
        jQuery('input#'+field).val( objects.join(',') );
    }
}

// Create an object listing for an entry or page. This is used for Selected
// Entry, Selected Page, and Reciprocal Objects.
function createObjectListing(obj_title, obj_id, obj_class, obj_permalink, blog_id) {
    var $preview = jQuery('<span/>')
        .addClass('obj-title')
        .text(obj_title);
    // Edit link.
    var $edit = jQuery('<a/>')
        .attr('href', CMSScriptURI+'?__mode=view&_type='+obj_class+'&id='+obj_id+'&blog_id='+blog_id)
        .addClass('edit')
        .attr('target', '_blank')
        .attr('title', 'Edit in a new window')
        .html('<img src="'+StaticURI+'images/status_icons/draft.gif" width="9" height="9" alt="Edit" />');
    // View link.
    var $view = jQuery('<a/>')
        .attr('href', obj_permalink)
        .addClass('view')
        .attr('target', '_blank')
        .attr('title', 'View in a new window')
        .html('<img src="'+StaticURI+'images/status_icons/view.gif" width="13" height="9" alt="View" />');
    // Delete button.
    var $remove = jQuery('<img/>')
        .addClass('remove')
        .attr('title', 'Remove selected entry')
        .attr('alt', 'Remove selected entry')
        .attr('src', StaticURI+'images/status_icons/close.gif')
        .attr('width', 9)
        .attr('height', 9);

    // Insert all of the above into a list item.
    var $li = jQuery('<li/>')
        .addClass('obj-'+obj_id)
        .append($preview)
        .append($edit)
        .append($view)
        .append($remove);

    return $li;
}

// Create the reciprocal entry association. This happens after selecting
// an entry from the popup.
function createReciprocalAssociation(obj_title, recip_obj_id, obj_class, obj_permalink, field, blog_id) {
    jQuery('input#'+field+'.reciprocal-object').val( recip_obj_id );

    // Create a list item populated with title, edit, view, and remove links.
    var $li = createObjectListing(
        obj_title,
        recip_obj_id,
        obj_class,
        obj_permalink,
        blog_id
    );

    jQuery('ul#custom-field-reciprocal-'+field)
        .append($li);
}

// Unlink the selected entry from the current entry for a Reciprocal Association.
function deleteReciprocalAssociation(field, recip_obj_id) {
    var type = jQuery('#entry_form input[name=_type]').val();
    jQuery.get(
        CMSScriptURI + '?__mode=unlink_reciprocal',
        {
            'recip_field_basename': field,
            'recip_entry_id': recip_obj_id,
            'cur_entry_id': jQuery('input[name=id]').val(),
            'recip_obj_type': type
        },
        function(data) {
            jQuery('#'+field+'_status').html(data.message).show(500);

            // The association was successfully deleted from the database,
            // so delete the visible data.
            if (data.status == 1) {
                jQuery('input#'+field).val('');
                jQuery('ul#custom-field-reciprocal-'+field).children().remove();
                setTimeout(function() {
                    jQuery('#'+field+'_status').hide(1000)
                }, 7000);
            }
        },
        'json'
    );
}