const User = require('../../models/user/userSchema');
const Address = require('../../models/user/addressSchema');
const { success, error: errorResponse } = require('../../helpers/responseHelper');
const Messages = require('../../constants/messages');
const HttpStatus = require('../../constants/statusCodes');
const mongoose = require('mongoose');

const loadAddress = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.session.user }).lean();
    res.render('user/address', {
      layout: 'layouts/userLayout',
      user:req.user,
      addresses,
      currentPage: 'address',
    });
  } catch (error) {
    console.log('Error loading address page');
    res.redirect('/profile');
  }
};

const loadAddAddress = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.session.user }).lean();
    res.render('user/addAddress', {
      layout: 'layouts/userLayout',
      user:req.user,
      addresses,
      currentPage: 'address',
    });
  } catch (error) {
    console.log('Error loading Add address page');
    res.redirect('/profile/address');
  }
};

const addAddress = async (req, res) => {
  try {
    const { fullName, email, phone, fullAddress, district, state, city, pincode, type } = req.body;
    const newAddress = { fullName, email, phone, fullAddress, district, state, city, pincode, type };

    //check user have already address
    const userAddressDoc = await Address.findOne({ userId: req.session.user });
    if (userAddressDoc) {
      userAddressDoc.address.push(newAddress);
      await userAddressDoc.save();
    } else {
      const saveAddress = new Address({
        userId: req.session.user,
        address: [newAddress],
      });
      await saveAddress.save();
    }

    return success(res, HttpStatus.CREATED, Messages.ADDRESS_CREATED);
  } catch (error) {
    console.log('user address updated error', error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadEditAddress = async (req, res) => {
  try {
    const nestedAddress = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(nestedAddress)) return res.redirect('/profile/address');

    const fullAddress = await Address.findOne({ userId: req.session.user });
    if (!fullAddress) return res.redirect('/profile/address');

    // find selected one
    const nestedAddressId = new mongoose.Types.ObjectId(nestedAddress);

    const address = fullAddress.address.find(a => a._id.equals(nestedAddressId));
    if (!address) return res.redirect('/profile/address');

    res.render('user/editAddress', {
      layout: 'layouts/userLayout',
      user:req.user,
      address,
      currentPage: 'address',
    });
  } catch (error) {
    console.log('Error loading edit address page', error);
    res.redirect('/profile/address');
  }
};

const editAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(addressId)) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.ADDRESS_NOT_FOUND);

    const data = req.body;

    await Address.updateOne(
      { userId: req.session.user, 'address._id': addressId },
      {
        $set: {
          'address.$.fullName': data.name,
          'address.$.email': data.email,
          'address.$.phone': data.phoneNumber,
          'address.$.fullAddress': data.addressLine1,
          'address.$.district': data.district,
          'address.$.state': data.state,
          'address.$.city': data.city,
          'address.$.pincode': data.pincode,
          'address.$.type': data.type,
        },
      },
    );
    success(res, HttpStatus.OK, Messages.ADDRESS_UPDATED);
  } catch (error) {
    console.log('Error editing address', error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const deleteAddress = async (req, res) => {
  try {
    const addrId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(addrId)) return res.redirect('/profile/address');

    const fullAddress = await Address.findOne({ userId: req.session.user });
    if (!fullAddress) return res.redirect('/profile/address');

    fullAddress.address.pull({ _id: addrId });
    await fullAddress.save();

    return success(res, HttpStatus.OK, Messages.ADDRESS_DELETED);
  } catch (error) {
    console.log('Error deleting address', error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

module.exports = {
  loadAddress,
  loadAddAddress,
  addAddress,
  loadEditAddress,
  editAddress,
  deleteAddress,
};
