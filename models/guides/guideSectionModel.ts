/* eslint-disable object-shorthand */
import { Types, Schema, model } from 'mongoose';
import slugify from 'slugify';

export interface IGuideSection {
    guideId: Types.ObjectId;
    anchor: string;
    title: string;
    meta: {
        createdAt: Date;
        updatedAt: Date;
    };
}

const guideSectionSchema: Schema<IGuideSection> = new Schema({
    guideId: {
        type: Schema.Types.ObjectId,
        required: [true, 'Секция должна быть прикреплена к справочному материалу'],
    },
    anchor: {
        type: String,
        default: function () {
            return slugify(this.title).toLowerCase();
        },
    },
    title: {
        type: String,
        required: [true, 'Укажите название секции'],
    },
    meta: {
        createdAt: {
            type: Date,
            default: Date,
        },
        updatedAt: Date,
    },
});

const GuideSection = model<IGuideSection>('guides_section', guideSectionSchema);

export default GuideSection;
