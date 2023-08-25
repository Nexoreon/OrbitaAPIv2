/* eslint-disable object-shorthand */
import { Types, Schema, model } from 'mongoose';
import slugify from 'slugify';

export interface IGuideSectionPart {
    guideId: Types.ObjectId;
    sectionId: Types.ObjectId;
    anchor: string;
    title: string;
    content: string;
    meta: {
        createdAt: Date;
        updatedAt: Date;
    };
}

const guideSectionPartSchema: Schema<IGuideSectionPart> = new Schema({
    guideId: {
        type: Schema.Types.ObjectId,
        required: [true, 'Часть секции должна быть прикреплена к материалу'],
    },
    sectionId: {
        type: Schema.Types.ObjectId,
        required: [true, 'Часть секции должна быть прикреплена к секции материала'],
    },
    anchor: {
        type: String,
        default: function () {
            return slugify(this.title).toLowerCase();
        },
    },
    title: {
        type: String,
        required: [true, 'Часть секции должна иметь название секции'],
    },
    content: {
        type: String,
        required: [true, 'Часть секции не может быть пустой'],
    },
    meta: {
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: Date,
    },
});

const GuideSectionPart = model<IGuideSectionPart>('guides_part', guideSectionPartSchema);

export default GuideSectionPart;
